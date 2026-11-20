const THEME_KEY = 'winter-theme';
const INTRO_KEY = 'winter-intro';
const MOTION_KEY = 'winter-motion';

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

export function readTheme() {
  return read(THEME_KEY) === 'day' ? 'day' : 'night';
}
export function saveTheme(theme) {
  write(THEME_KEY, theme);
}
export function readMotion() {
  const stored = read(MOTION_KEY);
  if (stored === 'paused' || stored === 'walking') return stored;
  return prefersReducedMotion() ? 'paused' : 'walking';
}
export function saveMotion(state) {
  write(MOTION_KEY, state);
}
export function introPlayed() {
  try { return sessionStorage.getItem(INTRO_KEY) === 'seen'; } catch { return false; }
}
export function markIntroPlayed() {
  try { sessionStorage.setItem(INTRO_KEY, 'seen'); } catch { /* private mode */ }
}
export function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
export function onReducedMotionChange(listener) {
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => listener(event.matches));
}
