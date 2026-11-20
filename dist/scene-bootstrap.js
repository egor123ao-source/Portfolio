(() => {
  const root = document.documentElement;
  let theme = 'night';
  let introSeen = false;

  // Only homepage gets Winter Walk animation. Other pages use standard layout.
  if (location.pathname !== '/' && !root.classList.contains('home')) return;

  try { 
    theme = localStorage.getItem('winter-theme') || 'night'; 
    introSeen = sessionStorage.getItem('winter-intro') === 'seen'; 
  } catch {}

  root.dataset.theme = theme === 'day' ? 'day' : 'night';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Only enable the animated scene on homepage when JS is active and motion is allowed.
  if (!introSeen && !reduce) root.classList.add('intro-pending');

  // If Three.js or graphics fail to initialize, gracefully fall back so portfolio never breaks.
  window.winterFailsafe = setTimeout(() => {
    if (root.dataset.sceneReady) return;
    root.classList.remove('intro-pending');
    root.dataset.scene = 'fallback';
    document.querySelector('#winter-intro')?.close();
    // Keep inert so user can scroll even if WebGL failed.
  }, 12000);
})();
