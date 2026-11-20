// Presentation effects are independent of match data, navigation, and accounts.
const intro = document.querySelector('.intro');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let introVisible = false;
let frame = 0;
let titleX = 0;
let titleY = 0;

function updateAmbientMotion() {
  if (!intro) return;
  intro.dataset.motion = String(introVisible && !document.hidden && !reducedMotion.matches
    && !document.documentElement.dataset.launch);
}

if (intro && 'IntersectionObserver' in window) {
  const introObserver = new IntersectionObserver(([entry]) => {
    introVisible = entry.isIntersecting;
    updateAmbientMotion();
  });
  introObserver.observe(intro);
}
addEventListener('ep:launch-finished', updateAmbientMotion);
addEventListener('pageshow', updateAmbientMotion);

function resetTitle() {
  cancelAnimationFrame(frame);
  frame = 0;
  intro?.style.removeProperty('--title-x');
  intro?.style.removeProperty('--title-y');
}

intro?.addEventListener('pointermove', event => {
  if (reducedMotion.matches || event.pointerType !== 'mouse') return;
  const bounds = intro.getBoundingClientRect();
  titleX = (0.5 - (event.clientY - bounds.top) / bounds.height) * 3;
  titleY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 3;
  if (frame) return;
  frame = requestAnimationFrame(() => {
    intro.style.setProperty('--title-x', `${titleX.toFixed(2)}deg`);
    intro.style.setProperty('--title-y', `${titleY.toFixed(2)}deg`);
    frame = 0;
  });
}, { passive: true });
intro?.addEventListener('pointerleave', resetTitle);
addEventListener('pagehide', () => {
  resetTitle();
  if (intro) intro.dataset.motion = 'false';
});

let sectionObserver;
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('section-enter');
      entry.target.addEventListener('animationend', () => {
        entry.target.classList.remove('section-enter');
      }, { once: true });
      sectionObserver.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  document.querySelectorAll('.content-section > .section-head, .guide-card').forEach(element => {
    sectionObserver.observe(element);
  });
}

reducedMotion.addEventListener('change', () => {
  updateAmbientMotion();
  if (!reducedMotion.matches) return;
  resetTitle();
  sectionObserver?.disconnect();
  document.querySelectorAll('.section-enter').forEach(element => {
    element.classList.remove('section-enter');
  });
});

document.addEventListener('visibilitychange', () => {
  updateAmbientMotion();
  if (document.hidden) resetTitle();
});
