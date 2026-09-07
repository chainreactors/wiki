#!/usr/bin/env python3
"""把 overrides/home.html 打包成可独立部署的单文件 SPA。

用法: python3 build_spa.py [--wiki-base URL] [--out DIR] [--font-subsets latin,latin-ext]
                           [--no-inline-fonts]

产物:
  index.html  自包含单文件（图片与字体内联为 data URI，站内链接指向 wiki-base）
  404.html    与 index.html 相同，作为静态托管的 SPA 回退页
  ../chainreactors-spa.zip
"""
import argparse
import base64
import hashlib
import mimetypes
import pathlib
import re
import shutil
import sys
import urllib.request
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "overrides" / "home.html"
ASSETS = ROOT / "docs" / "assets"
FONT_CACHE = ROOT / ".fontcache"

# 拿 woff2 而不是 ttf, css2 按 UA 决定返回哪种格式
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

# 内联的本地资源: 页面里的引用路径 -> 磁盘文件
INLINE_ASSETS = {
    "assets/chainreactors-favicon.png": ASSETS / "chainreactors-favicon.png",
    "assets/chainreactors-mark.png": ASSETS / "chainreactors-mark.png",
}

PRECONNECT = '  <link rel="preconnect" href="https://fonts.loli.net" crossorigin>\n'
FONT_LINK_RE = re.compile(r'[ \t]*<link href="(https://fonts\.loli\.net/css2[^"]+)" rel="stylesheet">\n')
# css2 在每个 @font-face 前用注释标注子集
FONT_FACE_RE = re.compile(r"/\* ([a-z-]+) \*/\s*(@font-face \{.*?\})", re.S)
FONT_URL_RE = re.compile(r"url\((https://[^)]+\.woff2)\)")


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read()


def data_uri(payload: bytes, mime: str) -> str:
    return "data:%s;base64,%s" % (mime, base64.b64encode(payload).decode())


def asset_uri(path: pathlib.Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return data_uri(path.read_bytes(), mime)


def cached(url: str, name: str) -> bytes:
    """下载并缓存, 重复构建不必联网。"""
    FONT_CACHE.mkdir(exist_ok=True)
    path = FONT_CACHE / name
    if not path.is_file():
        path.write_bytes(fetch(url))
    return path.read_bytes()


def sub(html: str, old: str, new: str, *, expect: int) -> str:
    """替换并校验命中次数, 模板改动后打包会直接报错而不是静默产出坏包。"""
    found = html.count(old)
    if found != expect:
        sys.exit("build_spa: expected %d occurrence(s) of %r, found %d" % (expect, old, found))
    return html.replace(old, new)


def inline_fonts(html: str, subsets: set) -> str:
    """把远端字体表换成内联 @font-face, 字体文件也内联进去。"""
    match = FONT_LINK_RE.search(html)
    if not match:
        sys.exit("build_spa: font stylesheet <link> not found in template")
    url = match.group(1)
    css = cached(url, "css2-%s.css" % hashlib.sha1(url.encode()).hexdigest()[:12]).decode("utf-8")
    del match  # 下面会改动 html, 位置偏移会失效, 统一用正则替换

    # 可变字体的多个 wght 共用同一个文件, 按 url 合并成一条 @font-face,
    # 否则同一份 base64 会被重复内联好几遍。
    groups = {}
    for subset, face in FONT_FACE_RE.findall(css):
        if subset not in subsets:
            continue
        url = FONT_URL_RE.search(face)
        weight = re.search(r"font-weight: (\d+)", face)
        if not url or not weight:
            sys.exit("build_spa: unparsable @font-face (%s)" % subset)
        group = groups.setdefault(url.group(1), {"face": face, "weights": []})
        group["weights"].append(int(weight.group(1)))

    faces, embedded = [], 0
    for url, group in groups.items():
        payload = cached(url, url.rsplit("/", 1)[-1])
        embedded += len(payload)
        face = FONT_URL_RE.sub(
            lambda _, u=data_uri(payload, "font/woff2"): "url(%s)" % u, group["face"])
        weights = sorted(group["weights"])
        if weights[0] != weights[-1]:
            face = re.sub(r"font-weight: \d+",
                          "font-weight: %d %d" % (weights[0], weights[-1]), face)
        faces.append(face)
    if not faces:
        sys.exit("build_spa: no @font-face kept, check --font-subsets")

    style = "  <style>\n%s\n  </style>\n" % "\n".join(
        "    " + re.sub(r"\s+", " ", f).strip() for f in faces)
    html = sub(html, PRECONNECT, "", expect=1)
    html, count = FONT_LINK_RE.subn(lambda _: style, html, count=1)
    if count != 1:
        sys.exit("build_spa: failed to replace font stylesheet <link>")
    print("fonts     : %d faces, %.1f KB woff2" % (len(faces), embedded / 1024))
    return html


def build(wiki_base: str, out_dir: pathlib.Path, subsets: set, with_fonts: bool) -> None:
    wiki_base = wiki_base.rstrip("/")
    html = SRC.read_text(encoding="utf-8")

    for ref, path in INLINE_ASSETS.items():
        if not path.is_file():
            sys.exit("build_spa: missing asset %s" % path)
        html = sub(html, '"%s"' % ref, '"%s"' % asset_uri(path), expect=html.count('"%s"' % ref))

    if with_fonts:
        html = inline_fonts(html, subsets)

    # 站内入口: 独立部署时必须是绝对地址
    html = sub(html, 'href="/wiki/"', 'href="%s/"' % wiki_base, expect=1)
    html = sub(html, 'href="/blog/"', 'href="%s/blog/"' % wiki_base, expect=1)
    # 博客列表: 抓取 wiki 的 blog 索引 (GitHub Pages 返回 access-control-allow-origin: *)
    html = sub(html, "fetch('/blog/')", "fetch('%s/blog/')" % wiki_base, expect=1)
    # 文章链接是相对 blog 索引的, 不能按当前 SPA 的 origin 解析
    html = sub(
        html,
        "titleEl.getAttribute('href') || '/blog/'",
        "titleEl.getAttribute('href') || '%s/blog/'" % wiki_base,
        expect=1,
    )
    html = sub(
        html,
        "new URL(href, window.location.href).href",
        "new URL(href, '%s/blog/').href" % wiki_base,
        expect=1,
    )

    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    index = out_dir / "index.html"
    index.write_text(html, encoding="utf-8")
    (out_dir / "404.html").write_text(html, encoding="utf-8")

    archive = out_dir.parent / (out_dir.name + ".zip")
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zf:
        for name in ("index.html", "404.html"):
            zf.write(out_dir / name, name)

    print("wiki base : %s" % wiki_base)
    print("index.html: %.1f KB" % (index.stat().st_size / 1024))
    print("zip       : %s (%.1f KB)" % (archive.relative_to(ROOT), archive.stat().st_size / 1024))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--wiki-base", default="https://wiki.chainreactors.red")
    ap.add_argument("--out", default="dist/chainreactors-spa")
    ap.add_argument("--font-subsets", default="latin,latin-ext",
                    help="内联哪些 unicode 子集 (中文走系统字体, 不需要内联)")
    ap.add_argument("--no-inline-fonts", dest="inline_fonts", action="store_false",
                    help="保留 fonts.loli.net CDN 引用")
    a = ap.parse_args()
    build(a.wiki_base, ROOT / a.out,
          {s.strip() for s in a.font_subsets.split(",") if s.strip()}, a.inline_fonts)
