(() => {
  'use strict';
  const root = document.documentElement;
  const page = root.dataset.crPage;
  if (!page || document.getElementById('cr-header')) return;
  const scriptURL = document.currentScript.src;
  const base = new URL('../', scriptURL);
  const href = path => { const url = new URL(path, base); return url.pathname + url.search + url.hash; };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const bilingual = ['home', 'guard', 'reactor'].includes(page);
  const header = document.createElement('header');
  header.id = 'cr-header';
  const products = [
    ['cyber', 'reactor/#products', 'Cyber', '敬请期待'], ['iom', 'reactor/#products', 'IoM', '恶联网 · 敬请期待'],
    ['guard', 'reactor/#products', 'CyberGuard', '面壁者 · 敬请期待'],
  ];
  header.innerHTML = `
    <a class="cr-brand" href="${href('')}" aria-label="CHAINREACTORS · 首页"><img src="${new URL('brand.svg', scriptURL).pathname}" alt="" width="20" height="20"><span><b>CHAINREACTORS</b><em>.AI</em></span></a>
    <div class="cr-actions">
      <div class="cr-explore">
        <button class="cr-menu-toggle" type="button" aria-label="打开导航" aria-controls="cr-navigation" aria-expanded="false"><span data-cr-copy="menu">菜单</span><i aria-hidden="true"></i></button>
        <nav class="cr-nav" id="cr-navigation" aria-label="主导航">
          ${page === 'home' ? '' : `<a class="cr-mobile-only" href="${href('')}">Home<span class="cr-subtitle">首页</span></a>`}
          <div class="cr-products">
            <button class="cr-product-toggle${products.some(([id]) => id === page) ? ' cr-product-current' : ''}" type="button" aria-controls="cr-product-links" aria-expanded="false"><span data-cr-copy="products">产品</span><i aria-hidden="true"></i></button>
            <div class="cr-product-menu" id="cr-product-links" hidden>
              ${products.map(([id, path, name, subtitle]) => `<a href="${href(path)}" ${page === id ? 'aria-current="page"' : ''}>${name}${subtitle ? `<span class="cr-subtitle">${subtitle}</span>` : ''}</a>`).join('')}
              <a class="cr-product-overview" href="${href('reactor/#products')}" data-cr-copy="overview">产品总览</a>
            </div>
          </div>
          <a href="${href('reactor/')}" ${page === 'reactor' ? 'aria-current="page"' : ''}>Open Source<span class="cr-subtitle">开源生态</span></a>
          <div class="cr-menu-divider" role="separator"></div>
          <a href="${href('reactor/#blog')}">Blog</a>
          ${page === 'reactor' ? `<a class="cr-mobile-only" href="#critical" data-cr-copy="finale">超临界</a>` : ''}
          <a href="https://github.com/chainreactors" target="_blank" rel="noopener noreferrer">GitHub<span class="cr-external" aria-hidden="true">↗</span></a>
          <a href="https://www.chainreactors.ai/recruitment.html" target="_blank" rel="noopener noreferrer" data-cr-copy="join">加入我们</a>
        </nav>
      </div>
      <div class="cr-languages" role="group" aria-label="Language" ${bilingual ? '' : 'hidden'}>
        <button class="cr-locale" type="button" data-cr-locale="zh" aria-label="切换为中文" aria-pressed="true">中</button><i aria-hidden="true">/</i><button class="cr-locale" type="button" data-cr-locale="en" aria-label="Switch to English" aria-pressed="false">EN</button>
      </div>
    </div>`;
  const skip = document.createElement('a');
  skip.className = 'cr-skip';
  skip.href = '#cr-main';
  document.body.prepend(skip, header);
  root.classList.add('cr-site-ready');

  const toggle = header.querySelector('.cr-menu-toggle');
  const localeButtons = [...header.querySelectorAll('.cr-locale')];
  const navigation = header.querySelector('.cr-nav');
  const productGroup = header.querySelector('.cr-products');
  const productToggle = header.querySelector('.cr-product-toggle');
  const productMenu = header.querySelector('.cr-product-menu');
  const compactHeader = matchMedia('(max-width: 899px)');
  let lang = 'zh';
  function syncLanguage() {
    lang = root.lang.startsWith('en') && bilingual ? 'en' : 'zh';
    const copy = lang === 'en'
      ? { home: 'Home', menu: 'Menu', products: 'Products', overview: 'Product Overview', finale: 'Supercritical', join: 'Join Us' }
      : { home: '首页', menu: '菜单', products: '产品', overview: '产品总览', finale: '超临界', join: '加入我们' };
    header.querySelectorAll('[data-cr-copy]').forEach(el => { el.textContent = copy[el.dataset.crCopy]; });
    localeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.crLocale === lang)));
    header.dataset.lang = lang;
    navigation.setAttribute('aria-label', lang === 'zh' ? '主导航' : 'Main navigation');
    header.querySelector('.cr-brand').setAttribute('aria-label', 'CHAINREACTORS · ' + copy.home);
    toggle.setAttribute('aria-label', toggle.getAttribute('aria-expanded') === 'true'
      ? (lang === 'zh' ? '收起导航' : 'Close navigation') : (lang === 'zh' ? '打开导航' : 'Open navigation'));
    skip.textContent = page === 'home' ? (lang === 'zh' ? '跳过动画，浏览产品' : 'Skip animation, explore products') : (lang === 'zh' ? '跳到主要内容' : 'Skip to content');
  }
  function setProducts(open, returnFocus = false) {
    productToggle.setAttribute('aria-expanded', String(open));
    productMenu.hidden = !open;
    if (returnFocus) productToggle.focus();
  }
  function setMenu(open, returnFocus = false) {
    open = compactHeader.matches && open;
    header.classList.toggle('cr-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    navigation.hidden = compactHeader.matches && !open;
    if (!open) setProducts(false);
    syncLanguage();
    if (returnFocus) toggle.focus();
  }
  compactHeader.addEventListener('change', () => {
    const focus = document.activeElement;
    const returnFocus = compactHeader.matches && navigation.contains(focus);
    setMenu(false, returnFocus);
    if (!compactHeader.matches && (focus === toggle || productMenu.contains(focus) || focus.matches('.cr-mobile-only'))) productToggle.focus();
  });
  setMenu(false);
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  toggle.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setMenu(true); navigation.querySelector('a, button')?.focus();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !productMenu.hidden) {
      e.preventDefault(); setProducts(false, true); return;
    }
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      e.preventDefault(); setMenu(false, true);
    }
  });
  productToggle.addEventListener('click', () => setProducts(productMenu.hidden));
  productToggle.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); setProducts(true);
      const links = productMenu.querySelectorAll('a');
      links[e.key === 'ArrowDown' ? 0 : links.length - 1]?.focus();
    }
  });
  productMenu.addEventListener('keydown', e => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const links = [...productMenu.querySelectorAll('a')];
    const index = links.indexOf(document.activeElement);
    links[(index + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length]?.focus();
  });
  productGroup.addEventListener('focusout', () => requestAnimationFrame(() => {
    if (!productGroup.contains(document.activeElement)) setProducts(false);
  }));
  document.addEventListener('click', e => {
    if (!productGroup.contains(e.target)) setProducts(false);
    if (!header.contains(e.target)) setMenu(false);
  });
  header.addEventListener('focusout', () => requestAnimationFrame(() => {
    if (!header.contains(document.activeElement)) setMenu(false);
  }));
  navigation.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  function nativeLocale(next) {
    const selector = page === 'home' ? `.ui.tr [data-set="${next}"]`
      : page === 'reactor' ? `header.nav .lang [data-lang="${next}"]` : '[data-testid="wall-locale"]';
    const button = document.querySelector(selector);
    if (!button) return false;
    if ((root.lang.startsWith('en') ? 'en' : 'zh') !== next) button.click();
    return true;
  }
  localeButtons.forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.crLocale;
    setMenu(false);
    if (nativeLocale(next)) {
      try { localStorage.setItem('cr-lang', next); localStorage.setItem('cr-sustain-lang', next); } catch (_) { /* optional storage */ }
      requestAnimationFrame(syncLanguage);
    }
  }));
  new MutationObserver(syncLanguage).observe(root, { attributes: true, attributeFilter: ['lang'] });
  syncLanguage();
  let preferred;
  try { preferred = new URLSearchParams(location.search).get('lang') || localStorage.getItem('cr-lang') || localStorage.getItem('cr-sustain-lang'); } catch (_) { /* optional storage */ }
  function readyPage() {
    const main = document.querySelector('main');
    if (!main) return false;
    if (!main.id) main.id = 'cr-main';
    skip.href = '#' + main.id;
    if (!main.hasAttribute('tabindex')) main.tabIndex = -1;
    if (bilingual && ['zh', 'en'].includes(preferred) && !nativeLocale(preferred)) return false;
    return true;
  }
  if (!readyPage()) {
    const observer = new MutationObserver(() => { if (readyPage()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }
  skip.addEventListener('click', e => {
    e.preventDefault(); setMenu(false);
    if (page === 'home') { window.dispatchEvent(new Event('cr:skip-story')); return; }
    const main = document.querySelector('main');
    main?.focus({ preventScroll: true });
    main?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  let topButton;
  if (page !== 'home') {
    topButton = document.createElement('button');
    topButton.type = 'button'; topButton.className = 'cr-back-top'; topButton.textContent = '↑'; topButton.hidden = true;
    topButton.setAttribute('aria-label', '返回顶部 / Back to top');
    topButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduced.matches ? 'instant' : 'smooth' });
      header.querySelector('.cr-brand').focus({ preventScroll: true });
    });
    document.body.append(topButton);
  }
  let scrollQueued = false;
  const onScroll = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      if (topButton) topButton.hidden = scrollY < innerHeight * 1.2;
      scrollQueued = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
