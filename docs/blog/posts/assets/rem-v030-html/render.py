"""Render all HTML mockups to PNG via playwright."""
import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
OUT = HERE.parent  # posts/assets/

# (html_file, png_name, width, height)
TARGETS = [
    ("01-overview.html",        "rem-v030-01-overview.png",        1600, 1100),
    ("02-topology.html",        "rem-v030-02-topology.png",        1600,  920),
    ("03-simplex.html",         "rem-v030-03-simplex.png",         1600, 1000),
    ("04-compose.html",         "rem-v030-04-compose.png",         1600, 1100),
    ("T1-inbound-matrix.html",  "rem-v030-T1-inbound-matrix.png",  1600,  900),
    ("T2-sr-arq.html",          "rem-v030-T2-sr-arq.png",          1600,  900),
]

async def render_one(page, html_path, out_path, w, h):
    await page.set_viewport_size({"width": w, "height": h})
    await page.goto(html_path.as_uri())
    await page.wait_for_load_state("networkidle")
    await page.screenshot(path=str(out_path), clip={"x": 0, "y": 0, "width": w, "height": h})

async def main(targets):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(device_scale_factor=2)
        page = await ctx.new_page()
        for html_name, out_name, w, h in targets:
            html_path = HERE / html_name
            out_path = OUT / out_name
            print(f"render {html_name} ({w}x{h})")
            await render_one(page, html_path, out_path, w, h)
            print(f"  -> {out_path}")
        await browser.close()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] != "all":
        prefix = sys.argv[1]
        targets = [t for t in TARGETS if t[0].startswith(prefix)]
    else:
        targets = TARGETS
    asyncio.run(main(targets))
