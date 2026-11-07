(() => {
  'use strict';
  const story = window.__cr?.story;
  if (!story) return;
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const labels = {
    zh: ['序章', '临界', '涌现', '链式反应', '受控', '在场'],
    en: ['Prologue', 'Critical mass', 'Emergence', 'Chain reaction', 'Control', 'Now'],
  };
  const nav = document.createElement('nav');
  nav.className = 'cr-story-nav'; nav.setAttribute('aria-label', '首页章节');
  nav.innerHTML = `<div class="cr-story-status"><span class="cr-story-count"></span><span class="cr-story-name"></span></div>
    <div class="cr-story-steps">${labels.zh.map((name, i) => `<button class="cr-story-step" type="button" data-chapter="${i}" aria-label="${i + 1}. ${name}"></button>`).join('')}</div>
    <div class="cr-story-actions"><span class="cr-story-instruction"></span><button type="button" class="cr-story-skip"></button><button type="button" class="cr-story-prev" aria-label="上一章">↑</button><button type="button" class="cr-story-next" aria-label="下一章">↓</button></div>`;
  document.body.append(nav);
  const curtain = document.createElement('div');
  curtain.className = 'cr-story-curtain'; curtain.setAttribute('aria-hidden', 'true');
  document.body.append(curtain);
  const steps = [...nav.querySelectorAll('[data-chapter]')];
  const prev = nav.querySelector('.cr-story-prev'), next = nav.querySelector('.cr-story-next');
  const skip = nav.querySelector('.cr-story-skip');
  const count = nav.querySelector('.cr-story-count'), name = nav.querySelector('.cr-story-name');
  const instruction = nav.querySelector('.cr-story-instruction');
  let active = -1, animation = 0, destination = -1, settling = 0;
  let statusKey = '';
  let velocity = 0, travelDirection = 0;
  const progressCache = [];
  let expectedY = scrollY;
  let pointerDown = false, touch = null, wheelAt = -Infinity, wheelDirection = 0, wheelSum = 0, consumed = false;
  let lang = root.lang.startsWith('en') ? 'en' : 'zh';
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const points = () => story.stops();
  const nearest = () => points().reduce((best, y, i, all) => Math.abs(y - scrollY) < Math.abs(all[best] - scrollY) ? i : best, 0);
  function update() {
    const stops = points();
    const index = nearest();
    nav.hidden = reduced.matches || scrollY > stops.at(-1) + 100;
    if (active !== index) {
      active = index;
      count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(stops.length).padStart(2, '0')}`;
      steps.forEach((button, i) => { if (i === index) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
    }
    steps.forEach((button, i) => {
      const progress = i === 0 ? '1' : clamp((scrollY - stops[i - 1]) / (stops[i] - stops[i - 1]), 0, 1).toFixed(3);
      if (progressCache[i] !== progress) { button.style.setProperty('--cr-step-progress', progress); progressCache[i] = progress; }
      button.toggleAttribute('data-pending', animation && i === destination);
    });
    prev.disabled = index === 0 && scrollY < 2;
    const key = `${lang}:${index}`;
    if (statusKey !== key) {
      statusKey = key;
      name.textContent = labels[lang][index];
      next.setAttribute('aria-label', index === stops.length - 1 ? (lang === 'zh' ? '查看联系方式' : 'View contact information') : (lang === 'zh' ? '下一章' : 'Next chapter'));
      instruction.textContent = index === stops.length - 1 ? '' : (lang === 'zh' ? '继续滚动可加速' : 'Keep scrolling to speed up');
      skip.textContent = index === stops.length - 1 ? (lang === 'zh' ? '重播' : 'Replay') : (lang === 'zh' ? '跳过动画' : 'Skip intro');
    }
  }
  function translate() {
    lang = root.lang.startsWith('en') ? 'en' : 'zh';
    nav.setAttribute('aria-label', lang === 'zh' ? '首页章节' : 'Story chapters');
    steps.forEach((b, i) => b.setAttribute('aria-label', `${i + 1}. ${labels[lang][i]}`));
    prev.setAttribute('aria-label', lang === 'zh' ? '上一章' : 'Previous chapter');
    update();
  }
  function stop(resetSpeed = true) {
    story.drive(null); animation = 0; destination = -1; velocity = 0; travelDirection = 0;
    if (resetSpeed) story.resetSpeed();
    root.classList.remove('cr-story-cut');
    clearTimeout(settling);
  }
  // Integrate a smooth velocity ramp for gentle starts and landings, with a
  // steady middle. Long shots cap each ramp at 900 ms instead of spending
  // seconds accelerating and then rushing through the scale changes.
  const integral = x => 2.5 * x ** 4 - 3 * x ** 5 + x ** 6;
  const smooth = x => x ** 3 * (10 - 15 * x + 6 * x * x);
  function pace(t, ramp) {
    if (t < ramp) return ramp * integral(t / ramp) / (1 - ramp);
    if (t > 1 - ramp) return 1 - ramp * integral((1 - t) / ramp) / (1 - ramp);
    return (t - ramp / 2) / (1 - ramp);
  }
  const paceSpeed = (t, ramp) => (t < ramp ? smooth(t / ramp) : t > 1 - ramp ? smooth((1 - t) / ramp) : 1) / (1 - ramp);
  function position(y, seek = false) {
    expectedY = Math.round(y);
    scrollTo(0, expectedY);
    if (seek) story.seek(expectedY);
    update();
  }
  function go(index, instant = false) {
    const momentum = velocity;
    const origin = nearest();
    stop();
    const stops = points();
    destination = clamp(index, 0, stops.length - 1);
    const from = scrollY, target = stops[destination];
    expectedY = from;
    if (instant || reduced.matches || Math.abs(target - from) < 2) {
      position(target, true); destination = -1; update(); return;
    }
    animation = 1; travelDirection = Math.sign(target - from);
    let elapsed = 0, last = performance.now();
    const delta = now => { const dt = Math.min(Math.max(now - last, 0), 64); last = now; return dt; };
    const finish = () => { position(target); stop(destination !== stops.length - 1); update(); };
    // Explicit jumps use a brief dissolve instead of fast-forwarding every scene.
    if (Math.abs(destination - origin) > 1) {
      root.classList.add('cr-story-cut');
      let placed = false;
      story.drive(now => {
        elapsed += delta(now);
        if (!placed && elapsed >= 320) { position(target, true); placed = true; travelDirection = 0; }
        if (elapsed >= 400) root.classList.remove('cr-story-cut');
        if (elapsed >= 760) finish();
      });
      update(); return;
    }
    const startTime = story.timeAt(from), endTime = story.timeAt(target);
    // A reversal first sheds its current momentum, without a one-frame stop.
    const braking = Math.abs(momentum) > .00001 ? 240 : 0;
    const turnTime = clamp(startTime + momentum * braking / 2, 0, story.timeEnd);
    const span = endTime - turnTime;
    const duration = Math.max(1000, Math.abs(span) * 1000);
    const ramp = Math.min(.22, 900 / duration);
    function tick(now, speed) {
      // Integrate playback time instead of shortening the duration in place:
      // changing the duration would jump the camera when a wheel event arrives.
      elapsed += delta(now) * (elapsed < braking ? 1 : speed);
      if (elapsed < braking) {
        const t = elapsed / braking;
        velocity = momentum * (1 - t * t * (3 - 2 * t));
        position(story.positionAt(startTime + momentum * braking * (t - t ** 3 + t ** 4 / 2)));
        return;
      }
      const t = clamp((elapsed - braking) / duration, 0, 1);
      velocity = span / duration * paceSpeed(t, ramp) * speed;
      position(story.positionAt(turnTime + span * pace(t, ramp)));
      if (t === 1) finish();
    }
    // Run before the scene is rendered, so the camera, copy and progress agree.
    story.drive(tick); update();
  }
  function scrollFooter() {
    stop();
    if (reduced.matches) document.getElementById('footer').scrollIntoView({ behavior: 'instant' });
    else position(points().at(-1), true);
  }
  function step(direction, explicit = false) {
    if (animation && direction === travelDirection) return;
    const stops = points();
    if (scrollY >= stops.at(-1) - 2 && direction > 0) {
      if (explicit || !story.isPlaying()) scrollFooter();
      return;
    }
    const index = direction > 0 ? stops.findIndex(y => y > scrollY + 2) : stops.findLastIndex(y => y < scrollY - 2);
    go(index < 0 ? 0 : index);
  }
  function skipStory() {
    stop(); story.finish();
    if (reduced.matches) document.querySelector('.fin').scrollIntoView({ behavior: 'instant' });
    else go(points().length - 1, true);
    requestAnimationFrame(() => document.querySelector('.fin .pr a')?.focus({ preventScroll: true }));
  }
  function ownsScroll(target) {
    if (target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], #cr-header.cr-menu-open')) return true;
    for (let el = target; el && el !== document.body && el !== root; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) return true;
    }
    return false;
  }
  const wheelPixels = e => Math.abs(e.deltaY) * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
  addEventListener('wheel', e => {
    if (reduced.matches || e.ctrlKey || e.metaKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || ownsScroll(e.target)) return;
    const last = points().at(-1);
    if (scrollY > last + 4) return;
    if (scrollY >= last - 2 && e.deltaY > 0 && !animation) {
      // The final shot uses the same playback rate even after the camera lands.
      if (story.isPlaying()) {
        e.preventDefault(); wheelAt = performance.now();
        story.accelerate(wheelPixels(e));
      }
      return;
    }
    if (!e.deltaY) return;
    e.preventDefault();
    const now = performance.now(), direction = Math.sign(e.deltaY);
    const fresh = now - wheelAt > 320 || direction !== wheelDirection;
    wheelAt = now; wheelDirection = direction;
    if (fresh) { wheelSum = 0; consumed = false; }
    if (animation && direction === travelDirection) {
      if (!root.classList.contains('cr-story-cut')) story.accelerate(wheelPixels(e));
      consumed = true; wheelSum = 0; return;
    }
    if (consumed) return;
    wheelSum += wheelPixels(e);
    if (wheelSum < 28) return;
    consumed = true; step(direction);
  }, { passive: false });
  addEventListener('keydown', e => {
    if (reduced.matches || e.ctrlKey || e.metaKey || e.altKey || ownsScroll(e.target) || e.target.closest('a, button')) return;
    if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) return;
    if (scrollY > points().at(-1) + 4 && !['Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    if (e.repeat) return;
    if (e.key === 'Home') go(0);
    else if (e.key === 'End') scrollFooter();
    else step(['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey) ? -1 : 1);
  });
  addEventListener('touchstart', e => {
    if (reduced.matches || e.touches.length !== 1 || ownsScroll(e.target) || scrollY > points().at(-1) + 4) { touch = null; return; }
    const t = e.touches[0];
    touch = { x: t.clientX, y: t.clientY, delta: 0, vertical: false };
  }, { passive: true });
  addEventListener('touchmove', e => {
    if (!touch) return;
    if (e.touches.length !== 1) { touch = null; return; }
    const dx = e.touches[0].clientX - touch.x, dy = touch.y - e.touches[0].clientY;
    if (!touch.vertical && Math.abs(dx) > Math.max(12, Math.abs(dy))) { touch = null; return; }
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) touch.vertical = true;
    if (touch.vertical) { if (e.cancelable) e.preventDefault(); touch.delta = dy; }
  }, { passive: false });
  addEventListener('touchend', () => {
    if (touch?.vertical && Math.abs(touch.delta) > 32) step(Math.sign(touch.delta));
    touch = null;
  }, { passive: true });
  addEventListener('touchcancel', () => { touch = null; }, { passive: true });
  function settle() {
    clearTimeout(settling);
    if (reduced.matches || animation || pointerDown || touch || scrollY > points().at(-1) + 4) return;
    settling = setTimeout(() => {
      if (!animation && !pointerDown && !touch && Math.abs(points()[nearest()] - scrollY) > 2) go(nearest());
    }, 480);
  }
  addEventListener('scroll', () => {
    if (animation && Math.abs(scrollY - expectedY) > 3) stop();
    update(); settle();
  }, { passive: true });
  addEventListener('pointerdown', e => {
    pointerDown = true;
    // A scrollbar drag takes control immediately, even during a chapter transition.
    if (e.clientX >= document.body.getBoundingClientRect().right) stop();
  }, { passive: true });
  addEventListener('pointerup', () => { pointerDown = false; settle(); }, { passive: true });
  addEventListener('pointercancel', () => { pointerDown = false; }, { passive: true });
  addEventListener('blur', () => { pointerDown = false; touch = null; stop(); });
  addEventListener('focus', settle);
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    const index = active;
    resizeTimer = setTimeout(() => { if (!reduced.matches && !nav.hidden) go(index, true); }, 180);
  });
  reduced.addEventListener('change', () => { stop(); update(); });
  new MutationObserver(translate).observe(root, { attributes: true, attributeFilter: ['lang'] });
  steps.forEach((button, i) => button.addEventListener('click', () => go(i)));
  prev.addEventListener('click', () => step(-1)); next.addEventListener('click', () => step(1, true));
  skip.addEventListener('click', () => { if (nearest() === points().length - 1) go(0); else skipStory(); });
  document.getElementById('topBtn')?.addEventListener('click', e => { e.stopImmediatePropagation(); go(0, true); document.querySelector('#cr-header .cr-brand').focus({ preventScroll: true }); }, true);
  addEventListener('cr:skip-story', skipStory);
  translate();
})();
