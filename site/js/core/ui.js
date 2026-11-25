// Small shared UI primitives: toast, modals, bilingual tooltips, IME-safe inputs.

import { getLang } from './prefs.js';
import { icon } from './icons.js';

// ---------------------------------------------------------------------------
// Layout modes, shared by CSS and JS:
//   phone   (max-width: 699px)  bottom tab bar, bottom sheets
//   tablet  wider + coarse pointer: desktop layout with touch-sized targets
//   desktop wider + fine pointer
// ---------------------------------------------------------------------------
const compactQuery = matchMedia('(max-width: 699px)');
const touchQuery = matchMedia('(pointer: coarse)');
export const isCompact = () => compactQuery.matches;
export const isTouch = () => touchQuery.matches;
export const onCompactChange = (fn) => compactQuery.addEventListener('change', fn);

// On-screen keyboards shrink the *visual* viewport but not fixed-position layout on
// iOS, so bottom sheets read --kb-offset to stay above the keyboard.
if (window.visualViewport) {
  const vv = window.visualViewport;
  const update = () => {
    const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--kb-offset', `${Math.round(offset)}px`);
    document.documentElement.classList.toggle('keyboard-open', offset > 80);
  };
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  update();
}

// ---------------------------------------------------------------------------
// Toast / snackbar: toast(msg) or toast(msg, { action: { label, run } })
// ---------------------------------------------------------------------------
let toastEl = null;
let toastTimer = null;
export function toast(msg, { action } = {}) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast-banner';
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.toggle('has-action', Boolean(action));
  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      toastEl.classList.remove('visible');
      action.run();
    });
    toastEl.appendChild(btn);
  }
  toastEl.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('visible'), action ? 5000 : 2400);
}

// ---------------------------------------------------------------------------
// Popover menus (dropdowns and context menus)
//   openMenu({ anchor | x,y, items: [{ id, label, icon?, checked?, disabled?, hint?, run }
//                                     | { separator: true } | { heading }] })
// Closes on outside click, Escape, scroll of the anchor's page, or choosing an item.
// Arrow keys move between items; Enter/Space chooses.
// ---------------------------------------------------------------------------
let openMenuEl = null;
export function closeMenu() {
  openMenuEl?.remove();
  openMenuEl = null;
}

export function openMenu({ anchor, x, y, items, align = 'start' }) {
  closeMenu();
  document.querySelector('.bilingual-tooltip')?.classList.remove('visible'); // don't cover the menu
  const el = document.createElement('div');
  el.className = 'popover-menu';
  el.setAttribute('role', 'menu');
  el.innerHTML = items
    .map((it, i) => {
      if (it.separator) return '<div class="menu-sep" role="separator"></div>';
      if (it.heading) return `<div class="menu-heading">${it.heading}</div>`;
      const role = it.checked === undefined ? 'menuitem' : 'menuitemcheckbox';
      return `<button type="button" class="menu-item${it.danger ? ' danger' : ''}" role="${role}" data-menu-index="${i}"
        ${it.checked !== undefined ? `aria-checked="${it.checked}"` : ''} ${it.disabled ? 'disabled' : ''}>
        <span class="menu-icon">${it.checked !== undefined ? (it.checked ? icon('check') : '') : it.icon ? icon(it.icon) : ''}</span>
        <span class="menu-label">${it.label}</span>${it.hint ? `<kbd class="menu-hint">${it.hint}</kbd>` : ''}</button>`;
    })
    .join('');
  document.body.appendChild(el);
  openMenuEl = el;
  el._anchor = anchor || null;

  // Position: under the anchor (or at x,y), kept inside the viewport.
  const r = anchor ? anchor.getBoundingClientRect() : { left: x, right: x, bottom: y, top: y };
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  let left = align === 'end' ? r.right - w : r.left;
  let top = r.bottom + (anchor ? 6 : 2);
  left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
  if (top + h > window.innerHeight - 8) top = Math.max(8, (anchor ? r.top - 6 : r.top) - h);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;

  const buttons = [...el.querySelectorAll('.menu-item:not([disabled])')];
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-menu-index]');
    if (!b) return;
    const item = items[Number(b.dataset.menuIndex)];
    closeMenu();
    item.run?.();
  });
  el.addEventListener('keydown', (e) => {
    const i = buttons.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') buttons[(i + 1) % buttons.length]?.focus();
    else if (e.key === 'ArrowUp') buttons[(i - 1 + buttons.length) % buttons.length]?.focus();
    else if (e.key === 'Escape') {
      closeMenu();
      anchor?.focus();
    } else return;
    e.preventDefault();
    e.stopPropagation();
  });
  // Keyboard users land on the first item; pointer users keep focus where it was.
  if (anchor && document.activeElement === anchor) buttons[0]?.focus({ preventScroll: true });
  return el;
}
// Anchor buttons toggle their menu: a second click closes it.
export function toggleMenu(options) {
  if (openMenuEl && options.anchor && openMenuEl._anchor === options.anchor) return closeMenu();
  return openMenu(options);
}

document.addEventListener(
  'pointerdown',
  (e) => {
    if (openMenuEl && !openMenuEl.contains(e.target) && !e.target.closest?.('[data-menu-anchor]')) closeMenu();
  },
  true
);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openMenuEl) {
    closeMenu();
    e.stopImmediatePropagation();
  }
});
window.addEventListener('resize', closeMenu);

// ---------------------------------------------------------------------------
// Swipe gestures on a sheet's grab area: onDown / onUp fire after a 60px drag.
// ---------------------------------------------------------------------------
export function bindSwipe(handle, { onDown, onUp }) {
  let startY = null;
  handle.addEventListener('touchstart', (e) => (startY = e.touches[0].clientY), { passive: true });
  handle.addEventListener(
    'touchend',
    (e) => {
      if (startY == null) return;
      const dy = e.changedTouches[0].clientY - startY;
      startY = null;
      if (dy > 60) onDown?.();
      else if (dy < -60) onUp?.();
    },
    { passive: true }
  );
}

// ---------------------------------------------------------------------------
// Modals: <div class="modal-backdrop" id="…"><div class="modal-card">…</div></div>
// Any [data-close-modal="id"] button closes its modal; Escape closes the top one.
// ---------------------------------------------------------------------------
export const openModal = (id) => document.getElementById(id)?.classList.add('open');
export const closeModal = (id) => document.getElementById(id)?.classList.remove('open');
export const anyModalOpen = () => Boolean(document.querySelector('.modal-backdrop.open'));

// fn() runs whenever the modal closes, however it was closed (✕, Done, Esc, backdrop, swipe).
export function onModalClose(id, fn) {
  const el = document.getElementById(id);
  let wasOpen = el.classList.contains('open');
  new MutationObserver(() => {
    const open = el.classList.contains('open');
    if (wasOpen && !open) fn();
    wasOpen = open;
  }).observe(el, { attributes: true, attributeFilter: ['class'] });
}

document.addEventListener('click', (e) => {
  const closer = e.target.closest('[data-close-modal]');
  if (closer) closeModal(closer.dataset.closeModal);
  else if (e.target.classList?.contains('modal-backdrop')) e.target.classList.remove('open');
});
// On phones modals are bottom sheets: swiping their title bar down closes them.
let sheetSwipe = null;
document.addEventListener(
  'touchstart',
  (e) => {
    const title = e.target.closest?.('.modal-backdrop.open .modal-title');
    sheetSwipe = title ? { y: e.touches[0].clientY, backdrop: title.closest('.modal-backdrop') } : null;
  },
  { passive: true }
);
document.addEventListener(
  'touchend',
  (e) => {
    if (sheetSwipe && e.changedTouches[0].clientY - sheetSwipe.y > 80 && isCompact()) sheetSwipe.backdrop.classList.remove('open');
    sheetSwipe = null;
  },
  { passive: true }
);

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = [...document.querySelectorAll('.modal-backdrop.open')].pop();
  if (open) {
    open.classList.remove('open');
    e.stopImmediatePropagation();
  }
});

// ---------------------------------------------------------------------------
// choose(): modal with several buttons; resolves to the chosen option's id,
// or null if dismissed (✕, backdrop, Escape).
//   await choose({ title, message, options: [{ id, label, tone?: 'primary'|'danger' }] })
// ---------------------------------------------------------------------------
export function choose({ title, message, options }) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'modal-backdrop open choose-dialog';
    el.innerHTML = `
      <div class="modal-card">
        <div class="modal-title"><span></span><button type="button" class="icon-btn small" data-choice="" aria-label="Close">${icon('close')}</button></div>
        <p class="panel-note choose-message"></p>
        <div class="modal-actions">${options
          .map((o) => `<button type="button" class="tb-btn ${o.tone === 'danger' ? 'danger' : o.tone === 'primary' ? 'primary' : ''}" data-choice="${o.id}"></button>`)
          .join('')}</div>
      </div>`;
    el.querySelector('.modal-title span').textContent = title;
    el.querySelector('.choose-message').textContent = message;
    options.forEach((o, i) => (el.querySelectorAll('.modal-actions [data-choice]')[i].textContent = o.label));
    document.body.appendChild(el);

    const finish = (value) => {
      observer.disconnect();
      el.remove();
      resolve(value || null);
    };
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-choice]');
      if (btn) finish(btn.dataset.choice);
    });
    // Backdrop click / Escape remove the "open" class (handlers above): treat as dismiss.
    const observer = new MutationObserver(() => !el.classList.contains('open') && finish(null));
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
  });
}

// ---------------------------------------------------------------------------
// IME-safe input binding: fires onChange(value, committed) only outside composition.
// onStart fires once per focus session before the first change (use for undo checkpoints).
// ---------------------------------------------------------------------------
export function bindImeField(el, onChange, { onStart } = {}) {
  if (!el) return;
  let composing = false;
  let started = false;
  const fire = (committed) => {
    if (!started) {
      started = true;
      onStart?.();
    }
    onChange(el.value, committed);
  };
  el.addEventListener('focus', () => (started = false));
  el.addEventListener('compositionstart', () => (composing = true));
  el.addEventListener('compositionend', () => {
    composing = false;
    fire(true);
  });
  el.addEventListener('input', (e) => {
    if (composing || e.isComposing) return;
    fire(false);
  });
}

export const isTyping = () => ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

// ---------------------------------------------------------------------------
// Bilingual tooltips: [data-tip-ja] / [data-tip-en] show the *other* language,
// so hovering a Japanese label reveals its English gloss and vice versa.
// ---------------------------------------------------------------------------
export function initTooltips() {
  const tip = document.createElement('div');
  tip.className = 'bilingual-tooltip';
  document.body.appendChild(tip);
  let longPress = null;

  const show = (target, x, y) => {
    const el = target?.closest?.('[data-tip-ja], [data-tip-en]');
    if (!el) return;
    const text = getLang() === 'en' ? el.dataset.tipJa : el.dataset.tipEn;
    if (!text) return;
    tip.textContent = text;
    tip.classList.add('visible');
    tip.style.left = `${Math.min(window.innerWidth - 270, Math.max(8, x + 10))}px`;
    tip.style.top = `${Math.min(window.innerHeight - 36, Math.max(8, y + 14))}px`;
  };

  document.addEventListener('mouseover', (e) => show(e.target, e.clientX, e.clientY));
  document.addEventListener('mouseout', (e) => {
    if (e.target?.closest?.('[data-tip-ja], [data-tip-en]')) tip.classList.remove('visible');
  });
  document.addEventListener(
    'touchstart',
    (e) => {
      const touch = e.touches[0];
      if (touch) longPress = setTimeout(() => show(e.target, touch.clientX, touch.clientY), 420);
    },
    { passive: true }
  );
  document.addEventListener('touchend', () => {
    clearTimeout(longPress);
    setTimeout(() => tip.classList.remove('visible'), 900);
  });
}
