import { GAMES, normalizeTeams, safeURL } from './app-core.js';
const games = new Set(GAMES.map(([key]) => key));
export function readFilters(search, fallback = 'all') {
  const p = new URLSearchParams(search), game = p.get('game');
  const tab = ['live', 'up', 'past'].includes(p.get('tab')) ? p.get('tab') : 'live';
  const period = tab !== 'live' && (tab === 'past' ? ['all', 'today', 'yesterday', 'week'] : ['all', 'today', 'tomorrow', 'week']).includes(p.get('period')) ? p.get('period') : 'all';
  return { game: games.has(game) ? game : games.has(fallback) ? fallback : 'all', tab, period, query: (p.get('q') || '').slice(0, 100) };
}
export function filterSearch({ game = 'all', tab = 'live', period = 'all', query = '' }) {
  const p = new URLSearchParams();
  // Include all explicitly, so a shared link overrides the recipient's preference.
  p.set('game', games.has(game) ? game : 'all');
  if (tab !== 'live') p.set('tab', tab);
  if (tab !== 'live' && period !== 'all') p.set('period', period);
  if (query.trim()) p.set('q', query.trim().slice(0, 100));
  return '?' + p;
}
const text = (value, limit = 300) => typeof value === 'string' ? value.slice(0, limit) : '';
export function validateBackup(input) {
  if (!input || input.app !== 'esports-pulse' || input.version !== 1 || !input.data || typeof input.data !== 'object') throw new Error('Это не резервная копия Esports Pulse');
  const d = input.data;
  if (![d.ft, d.fav, d.bk].every(Array.isArray) || d.ft.length > 100 || d.fav.length > 100 || d.bk.length > 500) throw new Error('Повреждённый файл или слишком много записей');
  const ft = normalizeTeams(d.ft).map(t => ({ name: text(t.name, 80), game: games.has(t.game) ? t.game : '' }));
  const fav = d.fav.filter(p => p && typeof p.n === 'string' && games.has(p.g)).map(p => ({ n: text(p.n, 80), g: p.g }));
  const bk = d.bk.filter(n => n && safeURL(n.link) && typeof n.title === 'string').map(n => ({ title: text(n.title), link: safeURL(n.link), src: text(n.src, 80), sum: text(n.sum, 2000), tt: text(n.tt), ts: text(n.ts, 2000), img: safeURL(n.img), date: Number.isFinite(new Date(n.date).getTime()) ? new Date(n.date).toISOString() : null }));
  return { ft, fav, bk, game: games.has(d.game) ? d.game : 'all', th: ['light', 'dark'].includes(d.th) ? d.th : null, hideScores: d.hideScores === true, orig: d.orig === true, compact: d.compact === true };
}
export function mergeBackup(current, imported) {
  const unique = (items, key) => [...new Map(items.map(x => [key(x), x])).values()];
  return { ...imported, ft: unique([...current.ft, ...imported.ft], x => `${x.game}|${x.name.toLowerCase()}`).slice(0, 100), fav: unique([...current.fav, ...imported.fav], x => `${x.g}|${x.n}`).slice(0, 100), bk: unique([...current.bk, ...imported.bk], x => x.link).slice(-500) };
}
