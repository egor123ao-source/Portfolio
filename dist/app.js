'use strict';

document.documentElement.classList.add('js');

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// The navigation stays usable with a keyboard and closes at the desktop breakpoint.
const menuButton = $('.menu-button');
const mobileNav = $('#mobile-nav');
function closeMenu(returnFocus = false) {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  mobileNav.hidden = true;
  if (returnFocus) menuButton.focus();
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileNav.hidden = !open;
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true);
});
document.addEventListener('click', (event) => {
  if (!mobileNav.hidden && !event.target.closest('.header')) closeMenu();
});
document.addEventListener('focusin', (event) => {
  if (!mobileNav.hidden && !event.target.closest('.header')) closeMenu();
});
matchMedia('(min-width: 681px)').addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});

// Three real directions, selected intentionally rather than autoplayed.
const heroTabs = $$('.showcase-tabs [role="tab"]');
function activateHero(tab, focus = false) {
  heroTabs.forEach((item, index) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    $(`#${item.getAttribute('aria-controls')}`).hidden = !selected;
    if (selected) $('#hero-index').textContent = `0${index + 1} / 03`;
  });
  if (focus) tab.focus();
}
heroTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateHero(tab));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % heroTabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + heroTabs.length) % heroTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = heroTabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      activateHero(heroTabs[next], true);
    }
  });
});

const filters = $$('[data-filter]');
const projectCards = $$('[data-category]');
function applyFilter(value, updateUrl = true) {
  const valid = filters.some((filter) => filter.dataset.filter === value);
  const selected = valid ? value : 'all';
  filters.forEach((filter) => filter.setAttribute('aria-pressed', String(filter.dataset.filter === selected)));
  let count = 0;
  projectCards.forEach((card) => {
    card.hidden = selected !== 'all' && selected !== card.dataset.category;
    if (!card.hidden) count++;
  });
  const counter = $('.filter-count');
  if (counter) counter.textContent = `Показано: ${count}`;
  if (updateUrl) {
    const url = new URL(location.href);
    if (selected === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', selected);
    history.replaceState(null, '', url);
  }
}
if (filters.length) {
  applyFilter(new URLSearchParams(location.search).get('category') || 'all', false);
  filters.forEach((filter) => filter.addEventListener('click', () => applyFilter(filter.dataset.filter)));
  addEventListener('popstate', () => applyFilter(new URLSearchParams(location.search).get('category') || 'all', false));
}

// The original image remains a normal link when JavaScript is unavailable.
const galleryLinks = $$('[data-lightbox]');
const lightbox = $('.lightbox');
let galleryIndex = 0;
let galleryTrigger;
function showImage(index) {
  galleryIndex = (index + galleryLinks.length) % galleryLinks.length;
  const link = galleryLinks[galleryIndex];
  $('#lightbox-image').src = link.href;
  $('#lightbox-image').alt = link.dataset.caption;
  $('#lightbox-caption').textContent = link.dataset.caption;
  $('#lightbox-count').textContent = `${galleryIndex + 1} / ${galleryLinks.length}`;
}
galleryLinks.forEach((link, index) => link.addEventListener('click', (event) => {
  if (!lightbox?.showModal) return;
  event.preventDefault();
  galleryTrigger = link;
  showImage(index);
  lightbox.showModal();
  document.body.classList.add('modal-open');
}));
if (lightbox) {
  $('.lightbox-close').addEventListener('click', () => lightbox.close());
  $$('[data-gallery-step]').forEach((button) => button.addEventListener('click', () => showImage(galleryIndex + Number(button.dataset.galleryStep))));
  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showImage(galleryIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  lightbox.addEventListener('click', (event) => {
    const rect = lightbox.getBoundingClientRect();
    if (event.target === lightbox && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    galleryTrigger?.focus({ preventScroll: true });
  });
}

let toastTimer;
function toast(message) {
  const box = $('.toast');
  clearTimeout(toastTimer);
  box.textContent = message;
  box.classList.add('visible');
  toastTimer = setTimeout(() => box.classList.remove('visible'), 4000);
}

// No API calls or storage: personal information leaves this page only on a chosen messenger link.
const form = $('#brief-form');
if (form) {
  const customBudget = $('.custom-budget');
  const amount = $('#custom-amount');
  const preview = $('#message-preview');
  const service = $('#service');
  const nameField = $('#client-name');
  const description = $('#description');
  let message = '';

  function updateBudget() {
    const custom = $('input[name="budget"]:checked', form).value === 'custom';
    customBudget.hidden = !custom;
    amount.disabled = !custom;
    amount.required = custom;
  }
  $$('input[name="budget"]', form).forEach((radio) => radio.addEventListener('change', updateBudget));
  const params = new URLSearchParams(location.search);
  if ([...service.options].some((option) => option.value === params.get('service'))) service.value = params.get('service');
  if (params.get('budget') === 'custom') $('input[value="custom"]', form).checked = true;
  updateBudget();

  function validateText(field, length, hint) {
    field.setCustomValidity(field.value.trim().length < length ? hint : '');
  }
  nameField.addEventListener('input', () => validateText(nameField, 2, 'Напишите имя: минимум 2 символа.'));
  description.addEventListener('input', () => validateText(description, 10, 'Расскажите о задаче: минимум 10 символов без лишних пробелов.'));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    validateText(nameField, 2, 'Напишите имя: минимум 2 символа.');
    validateText(description, 10, 'Расскажите о задаче: минимум 10 символов без лишних пробелов.');
    if (!form.reportValidity()) return;
    const budget = $('input[name="budget"]:checked', form).value;
    const labels = { discuss: 'Хочу обсудить', under20: 'До 20 000 ₸', '20to50': '20 000–50 000 ₸', over50: 'От 50 000 ₸' };
    const budgetText = budget === 'custom' ? `${new Intl.NumberFormat('ru-KZ').format(Number(amount.value))} ₸ — моё предложение` : labels[budget];
    message = `Егор, привет! Хочу обсудить проект.\n\nМеня зовут: ${nameField.value.trim()}\nЗадача: ${service.selectedOptions[0].textContent}\nБюджет: ${budgetText}\n\n${description.value.trim()}\n\nДавайте согласуем объём, стоимость и сроки до начала работы.`;
    $('#message-text').textContent = message;
    $('#send-telegram').href = 'https://t.me/ggh_then?text=' + encodeURIComponent(message);
    $('#send-whatsapp').href = 'https://wa.me/77754115824?text=' + encodeURIComponent(message);
    form.hidden = true;
    preview.hidden = false;
    preview.focus({ preventScroll: true });
    preview.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  });
  $('#edit-message').addEventListener('click', () => {
    preview.hidden = true;
    form.hidden = false;
    nameField.focus({ preventScroll: true });
    form.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  });
  $('#copy-message').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast('Сообщение скопировано');
    } catch {
      const range = document.createRange();
      range.selectNodeContents($('#message-text'));
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      toast('Выделил текст — скопируйте его вручную');
    }
  });
}
