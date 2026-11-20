// A short first-visit launch. The page remains usable if this file fails to load.
(() => {
  const dialog = document.querySelector('#launch-screen');
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const navigation = performance.getEntriesByType('navigation')[0];
  let hasLaunched = false;
  try { hasLaunched = sessionStorage.getItem('ep:launched') === 'true'; } catch {}

  const directEntry = location.hash || new URLSearchParams(location.search).has('account')
    || /^\/(player|team|tournament)\//.test(location.pathname);
  if (!dialog || hasLaunched || directEntry || reducedMotion.matches || document.hidden
    || navigation?.type === 'back_forward' || typeof dialog.showModal !== 'function'
    || getComputedStyle(dialog).getPropertyValue('--startup-ready').trim() !== '1') return;

  const controller = new AbortController();
  const events = { signal: controller.signal };
  const animations = [];
  const startedAt = performance.now();
  let state = 'loading';
  let readyTimer;
  let waitTimer;
  let safetyTimer;

  function finish() {
    if (state === 'done') return;
    state = 'done';
    clearTimeout(readyTimer);
    clearTimeout(waitTimer);
    clearTimeout(safetyTimer);
    controller.abort();
    animations.forEach(animation => animation.cancel());
    delete root.dataset.launch;
    if (dialog.open) dialog.close();
    dialog.hidden = true;
    try { sessionStorage.setItem('ep:launched', 'true'); } catch {}
    dispatchEvent(new Event('ep:launch-finished'));
  }

  function animate(element, keyframes, options) {
    const animation = element.animate(keyframes, { fill: 'forwards', ...options });
    animations.push(animation);
    // Cancellation on Escape, resize, or a preference change also settles the launch.
    return animation.finished.catch(() => {});
  }

  function reveal() {
    if (state !== 'loading') return;
    if (reducedMotion.matches || document.hidden) return finish();
    const surface = dialog.querySelector('.launch-surface');
    const target = document.querySelector('.intro') || document.querySelector('main');
    if (!target || typeof surface.animate !== 'function') return finish();

    state = 'revealing';
    clearTimeout(waitTimer);
    const start = surface.getBoundingClientRect();
    const bounds = target.getBoundingClientRect();
    const radius = getComputedStyle(target).borderRadius;
    root.dataset.launch = 'revealing';
    dialog.querySelector('#launch-status').textContent = 'Открываем Esports Pulse';

    try {
      const morph = animate(surface, [
        { left: `${start.left}px`, top: `${start.top}px`, width: `${start.width}px`, height: `${start.height}px`, transform: 'none', borderRadius: '50%', opacity: 1, offset: 0 },
        { left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px`, transform: 'none', borderRadius: radius, opacity: 1, offset: 0.72 },
        { left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px`, transform: 'none', borderRadius: radius, opacity: 0, offset: 1 }
      ], { duration: 1100, easing: 'cubic-bezier(.65, 0, .2, 1)' });
      const shade = animate(dialog.querySelector('.launch-shade'), [
        { opacity: 1 }, { opacity: 0 }
      ], { duration: 800, delay: 100, easing: 'ease-in-out' });
      const content = animate(dialog.querySelector('.launch-content'), [
        { opacity: 1, translate: '0 0', scale: 1 },
        { opacity: 0, translate: '0 -12px', scale: 0.94 }
      ], { duration: 260, easing: 'ease-out' });
      // Keep the skip button available until the native modal closes.
      Promise.all([morph, shade, content]).then(finish);
    } catch {
      finish();
    }
  }

  // Register the escape hatch before changing page visibility or opening the modal.
  safetyTimer = setTimeout(finish, 4200);
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); }, events);
  dialog.addEventListener('close', finish, events);
  dialog.querySelector('.launch-skip').addEventListener('click', () => {
    finish();
    document.querySelector('main')?.focus({ preventScroll: true });
  }, events);
  addEventListener('pagehide', finish, events);
  addEventListener('resize', () => { if (state === 'revealing') finish(); }, events);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); }, events);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) finish(); }, events);

  const markupReady = document.readyState === 'loading'
    ? new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { ...events, once: true }))
    : Promise.resolve();
  const interfaceReady = new Promise(resolve => {
    addEventListener('ep:ready', () => {
      dialog.querySelector('#launch-status').textContent = 'Подготавливаем оформление';
      resolve();
    }, { ...events, once: true });
  });

  try {
    dialog.hidden = false;
    dialog.showModal();
    root.dataset.launch = 'loading';
  } catch {
    finish();
    return;
  }

  waitTimer = setTimeout(reveal, 2600);
  Promise.all([interfaceReady, markupReady.then(() => document.fonts?.ready)])
    .then(() => {
      if (state !== 'loading') return;
      readyTimer = setTimeout(reveal, Math.max(0, 650 - (performance.now() - startedAt)));
    })
    .catch(reveal);
})();
