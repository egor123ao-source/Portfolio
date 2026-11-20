import { escapeHTML as esc } from './app-core.js';
import { validateBackup, mergeBackup } from './experience-core.js';

const KEYS = new Set(['ft', 'fav', 'bk', 'game', 'th', 'hideScores', 'orig', 'compact']);
const clean = state => validateBackup({ app: 'esports-pulse', version: 1, data: state });
const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const write = (key, value) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch {} };

export function initAccount({ getState, applyState, notify }) {
  const button = document.querySelector('#account-button');
  const dialog = document.createElement('dialog');
  dialog.id = 'account-dialog'; dialog.className = 'account-dialog'; dialog.setAttribute('aria-labelledby', 'account-title');
  document.body.append(dialog);
  let session = null, meta = read('ep_account_meta'), busy = false, saving = false, timer, version = 0, conflict = false, status = 'Проверяем вход…', recoveryCode = '', mode = 'login', ready = false;
  let guest = read('ep_guest_state');
  const remember = () => { if (session) { meta = { id: session.user.id, revision: conflict ? meta.revision : session.revision, dirty: !!meta?.dirty }; write('ep_account_meta', meta); } };
  function label() {
    button.innerHTML = `<span class="account-button-text">${esc(session ? session.user.username : 'Войти')}</span><svg class="account-button-icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>`;
    button.title = session ? `Аккаунт ${session.user.username}. ${status}` : status;
    button.setAttribute('aria-label', session ? `Аккаунт ${session.user.username}${conflict ? ': выберите версию сохранений' : ''}` : 'Войти в аккаунт');
    button.dataset.pending = String(!!meta?.dirty || conflict);
    const node = dialog.querySelector('#account-sync'); if (node) node.textContent = status;
  }
  async function request(action, data = {}) {
    const response = await fetch('/api/account', { method: action ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(20000), headers: action ? { 'Content-Type': 'application/json', 'X-CSRF-Token': session?.csrf || '' } : {}, body: action ? JSON.stringify({ action, ...data }) : undefined });
    let result; try { result = await response.json(); } catch { throw new Error('Сервис входа временно недоступен. Повторите позже.'); }
    if (!response.ok) throw Object.assign(new Error(result.error || 'Не удалось выполнить запрос.'), { status: response.status });
    return result;
  }
  function errorMessage(error) { return error.name === 'TimeoutError' || error instanceof TypeError ? 'Нет связи с сервером. Проверьте интернет и повторите.' : error.message; }
  function signedOut() {
    clearTimeout(timer); session = null; meta = null; conflict = false; recoveryCode = '';
    write('ep_account_meta', null);
    if (guest) applyState(clean(guest));
    else applyState(clean({ ft: [], fav: [], bk: [] }));
    guest = null; write('ep_guest_state', null); status = 'Вход не выполнен'; label();
  }
  async function refresh() {
    if (busy || saving) return;
    busy = true;
    try {
      const result = await request();
      if (!result.user) { if (meta?.dirty) { session = null; status = 'Сессия истекла. Войдите снова для синхронизации.'; label(); } else if (meta) signedOut(); else { session = null; status = 'Вход не выполнен'; label(); } if (dialog.open && mode === 'profile') render('login'); return; }
      const previous = session;
      session = result;
      if (meta?.id === result.user.id) {
        if (meta.dirty) {
          conflict = meta.revision !== result.revision;
          status = conflict ? 'Есть изменения на другом устройстве. Выберите версию сохранений.' : 'Есть изменения для синхронизации';
        } else { if (result.state) applyState(clean(result.state)); meta = { dirty: false }; remember(); status = 'Сохранения синхронизированы'; }
      } else {
        if (meta) signedOut();
        session = result;
        guest = clean(getState()); write('ep_guest_state', guest);
        if (result.state) applyState(clean(result.state));
        meta = { dirty: !result.state }; remember(); status = 'Вход выполнен';
      }
      label();
      if (dialog.open && !dialog.querySelector('form') && !recoveryCode && previous?.user.id !== session.user.id) render('profile');
    } catch (error) { status = errorMessage(error); label(); }
    finally { busy = false; ready = true; if (session && meta?.dirty && !conflict) schedule(); }
  }
  async function sync() {
    if (!session || !meta?.dirty || busy || saving || conflict) return;
    saving = true; const stamp = version;
    status = 'Сохраняем…'; label();
    try {
      const result = await request('save', { state: clean(getState()), revision: session.revision });
      session.revision = result.revision; meta.dirty = stamp !== version; remember();
      status = meta.dirty ? 'Сохраняем новые изменения…' : 'Сохранения синхронизированы';
    } catch (error) {
      if (error.status === 409) conflict = true;
      status = errorMessage(error);
      if (error.status === 401) { session = null; status = 'Сессия истекла. Войдите снова, чтобы сохранить изменения.'; if (dialog.open) render('login'); }
      if (dialog.open && mode === 'profile') render('profile');
    } finally { saving = false; label(); if (!conflict && stamp !== version) schedule(); }
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(sync, 500); }
  function changed() {
    version++;
    if (session || meta) { meta = { ...meta, dirty: true }; if (session) remember(); else write('ep_account_meta', meta); status = navigator.onLine ? 'Ожидает синхронизации' : 'Изменения на устройстве. Синхронизируем после подключения.'; label(); schedule(); }
  }
  addEventListener('ep:changed', changed);
  addEventListener('online', refresh);
  addEventListener('focus', refresh);
  addEventListener('storage', event => {
    if (event.key === 'ep_account_meta') { meta = read('ep_account_meta'); if (!meta && session) { signedOut(); if (dialog.open) render('login'); } else refresh(); }
    else if (KEYS.has(event.key)) { applyState(clean(getState())); }
  });
  addEventListener('beforeunload', event => { if (session && meta?.dirty) { event.preventDefault(); event.returnValue = ''; } });

  const field = (name, label, type = 'text', autocomplete = '', hint = '') => `<label class="account-field"><span>${label}</span><input name="${name}" type="${type}" ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${name === 'username' ? 'minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" autocapitalize="none" spellcheck="false"' : type === 'password' ? 'minlength="12" maxlength="128"' : 'maxlength="100"'} required ${hint ? `aria-describedby="hint-${name}"` : ''}>${hint ? `<small id="hint-${name}">${hint}</small>` : ''}</label>`;
  function render(next = session ? 'profile' : 'login') {
    mode = next;
    let title, body;
    if (recoveryCode) {
      title = 'Сохраните резервный код';
      body = `<p>Он заменит пароль, если вы его забудете. Код показывается только сейчас. Сохраните его в менеджере паролей или скачайте файл.</p><code class="recovery-code">${esc(recoveryCode)}</code><button class="mo" data-do="download">Скачать резервный код</button><label class="account-check"><input id="code-saved" type="checkbox">Я сохранил код в надёжном месте</label><button class="bt" data-do="continue" disabled>Продолжить</button><p class="ds">После восстановления выдаётся новый код. Без пароля и кода восстановить доступ не получится.</p>`;
    } else if (next === 'profile' && session) {
      title = session.user.username;
      const s = getState();
      body = `<p id="account-sync" role="status">${esc(status)}</p><div class="account-counts"><span><strong>${s.ft.length}</strong> команд</span><span><strong>${s.fav.length}</strong> игроков</span><span><strong>${s.bk.length}</strong> новостей</span></div>${conflict ? '<div class="account-notice"><p>Сохранения изменились на другом устройстве. Загрузите облачную версию или замените её текущей. Настройки и удаления тоже учитываются.</p><button class="mo" data-do="cloud">Загрузить из аккаунта</button><button class="mo" data-do="local">Сохранить эту версию</button></div>' : '<button class="mo" data-do="sync">Синхронизировать сейчас</button>'}${guest && (guest.ft.length || guest.fav.length || guest.bk.length) ? '<button class="mo" data-do="merge">Добавить гостевое избранное</button>' : ''}<div class="account-links"><button data-view="password">Изменить пароль</button><button data-do="logout">Выйти</button><button data-do="logout-all">Выйти на всех устройствах</button><button class="account-danger" data-view="delete">Удалить аккаунт</button></div><p class="ds">При выходе на устройстве останутся только гостевые сохранения. <a href="/privacy.html">Хранение данных</a></p>`;
    } else {
      const register = next === 'register', recover = next === 'recover', password = next === 'password', remove = next === 'delete';
      title = register ? 'Ваш аккаунт Esports Pulse' : recover ? 'Восстановить доступ' : password ? 'Изменить пароль' : remove ? 'Удалить аккаунт?' : 'С возвращением';
      body = `<p>${register ? 'Сохраняйте команды, игроков и новости — они будут доступны на всех ваших устройствах. Гостевое избранное добавится в новый аккаунт.' : recover ? 'Введите логин, резервный код и новый пароль. Все текущие сеансы будут завершены.' : password ? 'После смены пароля другие устройства выйдут из аккаунта. Вы получите новый резервный код.' : remove ? 'Аккаунт и облачные сохранения будут удалены без возможности восстановления. Для подтверждения введите пароль.' : 'Войдите, чтобы открыть свои сохранения и настройки.'}</p><form id="account-form">${password || remove ? '' : field('username', 'Логин', 'text', 'username', register ? '3–24 латинские буквы, цифры или знак _' : '')}${recover ? field('recoveryCode', 'Резервный код', 'text', 'off') : ''}${field('password', recover ? 'Новый пароль' : password || remove ? 'Текущий пароль' : 'Пароль', 'password', register || recover ? 'new-password' : 'current-password', register || recover ? 'Минимум 12 символов. Можно использовать длинную фразу.' : '')}${password ? field('newPassword', 'Новый пароль', 'password', 'new-password', 'От 12 до 128 символов') : ''}<label class="account-check"><input id="show-password" type="checkbox">Показать пароль</label><button class="bt ${remove ? 'account-danger' : ''}" type="submit">${register ? 'Создать аккаунт' : recover ? 'Восстановить доступ' : password ? 'Сохранить пароль' : remove ? 'Удалить навсегда' : 'Войти'}</button></form><div class="account-links">${password || remove ? '<button data-view="profile">Назад в аккаунт</button>' : register || recover ? '<button data-view="login">Уже есть аккаунт? Войти</button>' : '<button data-view="register">Создать аккаунт</button><button data-view="recover">Забыли пароль?</button>'}</div>${register ? '<p class="ds">Email не нужен. Для восстановления выдадим резервный код. <a href="/privacy.html">Как хранятся данные</a></p>' : ''}`;
    }
    dialog.innerHTML = `<button class="account-close" type="button" aria-label="Закрыть окно аккаунта">×</button><p class="eyebrow">Личный кабинет</p><h2 id="account-title">${esc(title)}</h2>${body}<p id="account-error" class="account-error" role="alert" tabindex="-1"></p>`;
    dialog.querySelector('.account-close').onclick = () => dialog.close();
    dialog.querySelector('#show-password')?.addEventListener('change', event => dialog.querySelectorAll('input[name="password"],input[name="newPassword"]').forEach(input => { input.type = event.target.checked ? 'text' : 'password'; }));
    dialog.querySelector('#code-saved')?.addEventListener('change', event => { dialog.querySelector('[data-do="continue"]').disabled = !event.target.checked; });
    dialog.querySelectorAll('[data-view]').forEach(el => { el.onclick = () => { render(el.dataset.view); dialog.querySelector('input')?.focus(); }; });
    dialog.querySelectorAll('[data-do]').forEach(el => { el.onclick = () => perform(el.dataset.do); });
    const form = dialog.querySelector('form'); if (form) form.onsubmit = submit;
  }
  function fail(error) { const node = dialog.querySelector('#account-error'); if (node) { node.textContent = errorMessage(error); node.focus(); } }
  function setBusy(value) { dialog.querySelectorAll('button,input').forEach(el => { el.disabled = value; }); dialog.setAttribute('aria-busy', String(value)); }
  async function submit(event) {
    event.preventDefault();
    const form = event.target, data = Object.fromEntries(new FormData(form)), action = mode;
    // The initial session request can still be running when a fast user submits.
    // Keep the submitted values and wait, rather than silently dropping the form.
    if (busy || saving) { setBusy(true); while (busy || saving) await new Promise(resolve => setTimeout(resolve, 50)); setBusy(false); if (!form.isConnected) return; }
    busy = true; setBusy(true);
    try {
      const result = await request(action, data);
      if (action === 'delete') { signedOut(); render('login'); notify('Аккаунт удалён'); return; }
      if (action === 'recover') { signedOut(); recoveryCode = result.recoveryCode; render('login'); return; }
      if (action === 'login' || action === 'register') {
        const returning = meta?.id === result.user.id;
        if (!returning) {
          if (meta) signedOut();
          guest = clean(getState()); write('ep_guest_state', guest);
        }
        session = result;
        if (returning && meta.dirty) { conflict = meta.revision !== result.revision; }
        else { if (result.state) applyState(clean(result.state)); meta = { dirty: !result.state }; conflict = false; }
        remember();
      } else session = result;
      recoveryCode = result.recoveryCode || '';
      status = conflict ? 'Изменения на двух устройствах. Выберите версию.' : 'Вход выполнен';
      label(); render('profile'); notify(action === 'register' ? 'Аккаунт создан' : action === 'password' ? 'Пароль изменён' : 'Вы вошли в аккаунт');
    } catch (error) { fail(error); }
    finally { busy = false; setBusy(false); if (recoveryCode) dialog.querySelector('[data-do="continue"]').disabled = !dialog.querySelector('#code-saved').checked; if (meta?.dirty && !conflict) schedule(); }
  }
  async function perform(action) {
    if (action === 'download') {
      const url = URL.createObjectURL(new Blob([`Esports Pulse\nЛогин: ${session?.user.username || 'указан при восстановлении'}\nРезервный код: ${recoveryCode}\nhttps://esports-pulse-news.vercel.app/\nХраните код в тайне. Он позволяет изменить пароль.\n`], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = 'esports-pulse-recovery.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
    }
    if (action === 'continue') { recoveryCode = ''; render(session ? 'profile' : 'login'); return; }
    if (busy) return;
    // A click during an autosave waits for that save instead of being dropped.
    if (saving) { setBusy(true); while (saving) await new Promise(resolve => setTimeout(resolve, 50)); setBusy(false); }
    busy = true; setBusy(true);
    try {
      if (action === 'logout' || action === 'logout-all') {
        // Flush pending changes first. A conflict remains reviewable instead of losing edits.
        if (meta?.dirty) {
          if (conflict) throw new Error('Сначала выберите версию сохранений.');
          const saved = await request('save', { state: clean(getState()), revision: session.revision }); session.revision = saved.revision; meta.dirty = false; remember();
        }
        await request(action); signedOut(); render('login'); notify('Вы вышли из аккаунта');
      } else if (action === 'merge') {
        applyState(mergeBackup(clean(guest), clean(getState()))); changed(); render('profile');
      } else if (action === 'cloud' || action === 'local') {
        const latest = await request();
        if (!latest.user || latest.user.id !== session.user.id) throw new Error('Сессия изменилась. Обновите страницу.');
        session = latest;
        if (action === 'cloud' && latest.state) applyState(clean(latest.state));
        conflict = false; meta.dirty = action === 'local'; remember(); status = action === 'local' ? 'Ожидает синхронизации' : 'Загружено из аккаунта'; render('profile');
      } else if (action === 'sync') { busy = false; await refresh(); if (meta?.dirty) await sync(); render('profile'); }
    } catch (error) { if (error.status === 409) { conflict = true; status = error.message; render('profile'); } fail(error); }
    finally { busy = false; setBusy(false); label(); if (meta?.dirty && !conflict) schedule(); }
  }
  function open() { render(session ? 'profile' : 'login'); if (!dialog.open) dialog.showModal(); if (!ready) refresh(); }
  button.onclick = event => { event.preventDefault(); open(); };
  // Preserve the one-time recovery code until acknowledged; closing does not discard it.
  dialog.addEventListener('close', () => { dialog.innerHTML = ''; button.focus(); });
  refresh();
  if (new URLSearchParams(location.search).has('account')) { open(); const url = new URL(location.href); url.searchParams.delete('account'); history.replaceState(null, '', url.pathname + url.search + url.hash); }
  return { refresh, changed };
}
