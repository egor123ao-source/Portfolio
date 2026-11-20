// Pure helpers shared by the interface and the regression tests.
export const GAMES = [['all', 'Все игры'], ['csgo', 'CS2'], ['dota2', 'Dota 2'], ['valorant', 'Valorant'], ['lol', 'LoL'], ['r6siege', 'R6 Siege'], ['ow', 'Overwatch'], ['rl', 'Rocket League'], ['codmw', 'Call of Duty']];
export const COLORS = { csgo: '#c17a14', dota2: '#c74747', valorant: '#ce485c', lol: '#397bc5', r6siege: '#7e8ba2', ow: '#ca7428', rl: '#1586ad', codmw: '#668b28' };
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/*
SVG icon paths adapted from https://lucide.dev (ISC; Feather-derived icons MIT).
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project:

airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
// One size and stroke for all interface actions.
export function icon(name, filled = false) {
  const paths = {
    settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--bg)"/><circle cx="15" cy="17" r="3" fill="var(--bg)"/>',
    share: '<path d="M12 16V3m-4 4 4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>',
    bookmark: '<path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    external: '<path d="M15 3h6v6m0-6L10 14m-1-9H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    play: '<path d="m8 5 11 7-11 7Z"/>',
    pause: '<path d="M9 5v14M15 5v14"/>',
  };
  const path = Object.hasOwn(paths, name) ? paths[name] : paths.right;
  return `<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
}
export function safeURL(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
export const gameName = game => GAMES.find(([slug]) => slug === game)?.[1] || game || 'Все игры';
export function matchKind(match, fallback = 'up') {
  const statuses = { running: 'live', finished: 'past', not_started: 'up', canceled: 'canceled', postponed: 'postponed' };
  return statuses[match.status] || (match.win ? 'past' : fallback);
}
export function dateRange(period, tab = 'up', now = new Date()) {
  if (period === 'all') return {};
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  if (period === 'tomorrow') start.setDate(start.getDate() + 1);
  if (period === 'yesterday') start.setDate(start.getDate() - 1);
  if (period === 'week' && tab === 'past') start.setDate(start.getDate() - 6);
  end.setTime(start.getTime());
  end.setDate(end.getDate() + (period === 'week' ? 7 : 1));
  return { from: start.toISOString(), to: new Date(end.getTime() - 1).toISOString() };
}
export function filterMatches(matches, { game = 'all', query = '', from, to } = {}) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return matches.filter(m => {
    if (game !== 'all' && m.slug !== game) return false;
    const text = `${m.a} ${m.b} ${m.event} ${m.game}`.toLocaleLowerCase();
    if (!terms.every(term => text.includes(term))) return false;
    if (from || to) {
      const time = new Date(m.t).getTime();
      if (!Number.isFinite(time) || (from && time < Date.parse(from)) || (to && time > Date.parse(to))) return false;
    }
    return true;
  });
}
export function uniqueMatches(matches) {
  return [...new Map(matches.map(m => [String(m.id), m])).values()];
}
export function normalizeTeams(value) {
  if (!Array.isArray(value)) return [];
  const entries = value.map(t => typeof t === 'string' ? { name: t, game: '' } : t)
    .filter(t => t && typeof t.name === 'string' && t.name.trim())
    .map(t => ({ name: t.name.trim(), game: typeof t.game === 'string' ? t.game : '' }));
  return [...new Map(entries.map(t => [`${t.game}|${t.name.toLowerCase()}`, t])).values()];
}
export function isFollowed(teams, name, game) {
  return teams.some(t => t.name.toLowerCase() === name.toLowerCase() && (!t.game || t.game === game));
}
export function toggleTeam(teams, name, game) {
  if (isFollowed(teams, name, game)) return teams.filter(t => !(t.name.toLowerCase() === name.toLowerCase() && (!t.game || t.game === game)));
  return [...teams, { name, game }];
}
const newsPatterns = {
  csgo: /\b(?:cs2|cs:go|counter[ -]?strike|hltv)\b/i,
  dota2: /\bdota\b|дот[аыуе]/i,
  valorant: /\bvalorant\b|валорант/i,
  lol: /\bleague of legends\b|\blol\b|лига легенд/i,
  r6siege: /\brainbow six\b|\br6(?:siege)?\b/i,
  ow: /\boverwatch\b|оверво[тч]/i,
  rl: /\brocket league\b/i,
  codmw: /\bcall of duty\b|\bwarzone\b|\bCDL\b/i,
};
export function newsMatchesGame(item, game) {
  if (game === 'all') return true;
  if (item.game === game || item.games?.includes(game)) return true;
  return newsPatterns[game]?.test([item.src, item.title, item.sum, item.tt, item.ts].filter(Boolean).join(' ')) || false;
}
export function createRequestGate() {
  const active = new Map();
  return {
    begin(key) {
      active.get(key)?.abort();
      const controller = new AbortController();
      active.set(key, controller);
      return { signal: controller.signal, current: () => active.get(key) === controller && !controller.signal.aborted };
    },
    cancel(key) { active.get(key)?.abort(); active.delete(key); },
  };
}
const calendarEscape = value => String(value ?? '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/[,;]/g, '\\$&');
const calendarTime = value => new Date(value).toISOString().replace(/[-:]|\.\d+/g, '');
export function calendarEvent(match, now = new Date()) {
  if (!match.t || !Number.isFinite(Date.parse(match.t))) throw new Error('Match start is unknown');
  const end = Date.parse(match.t) + 3600000 * (match.bo > 1 ? 3 : 1.5);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EsportsPulse//RU', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${calendarEscape(match.id)}@esportspulse`, `DTSTAMP:${calendarTime(now)}`, `DTSTART:${calendarTime(match.t)}`, `DTEND:${calendarTime(end)}`,
    `SUMMARY:${calendarEscape(`${match.a} vs ${match.b} (${match.game})`)}`, `DESCRIPTION:${calendarEscape(match.event)}`, 'END:VEVENT', 'END:VCALENDAR'];
  // Fold by UTF-8 octets without splitting a Unicode code point (RFC 5545).
  return lines.map(line => {
    const parts = []; let part = '', size = 0;
    for (const char of line) {
      const bytes = new TextEncoder().encode(char).length;
      if (size + bytes > 75) { parts.push(part); part = ' '; size = 1; }
      part += char; size += bytes;
    }
    return [...parts, part].join('\r\n');
  }).join('\r\n') + '\r\n';
}
