import { icon } from './app-core.js';
const root = document.documentElement, button = document.querySelector('#tg');
function renderTheme() { const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches; button.innerHTML = icon(dark ? 'sun' : 'moon'); button.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему'); button.setAttribute('aria-pressed', String(dark)); }
button.onclick = () => { const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches; root.dataset.theme = dark ? 'light' : 'dark'; try { localStorage.setItem('th', JSON.stringify(root.dataset.theme)); } catch {} renderTheme(); };
renderTheme(); matchMedia('(prefers-color-scheme:dark)').addEventListener('change', renderTheme);
const toggle = document.querySelector('#menu-toggle'), nav = document.querySelector('#main-nav');
function menu(open) { nav.dataset.open = String(open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); toggle.innerHTML = icon(open ? 'close' : 'menu'); }
menu(false); toggle.onclick = () => menu(toggle.getAttribute('aria-expanded') !== 'true');
document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.dataset.open === 'true') { menu(false); toggle.focus(); } });
document.addEventListener('click', e => { if (!e.target.closest('header') || e.target.closest('nav a')) menu(false); });
dispatchEvent(new Event('ep:ready'));
