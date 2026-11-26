// Grammar: the pattern catalog the analyser knows, grouped and filterable (by level
// chips, and multi-select dropdowns for grammar group and logic function: any choice
// within one filter, all filters together), each
// with an example that opens in Breakdown. Once the tokenizer is ready, the
// matched part of every example is highlighted (which doubles as a live check
// that the example still triggers its pattern).

import { initPage } from '../core/hub.js';
import { t, tr, onPrefsChange } from '../core/prefs.js';
import { icon } from '../core/icons.js';
import { escapeHtml as esc, fold, debounce } from '../core/util.js';
import { PATTERNS, GROUPS, LEVELS, LOGIC } from '../engine/patterns.js';
import { levelBadge, logicBadge } from './render.js';
import { analyze, onTokenizerState } from '../engine/tokenizer.js';

await initPage('grammar');

const $ = (id) => document.getElementById(id);
const search = $('gr-search');
const levels = new Set();
const groups = new Set();
const logics = new Set();
const spans = new Map(); // pattern id → [start, end] character offsets in its example

function exampleHtml(p) {
  const span = spans.get(p.id);
  const text = span ? `${esc(p.ex.slice(0, span[0]))}<mark>${esc(p.ex.slice(span[0], span[1]))}</mark>${esc(p.ex.slice(span[1]))}` : esc(p.ex);
  return `<a class="gr-example" href="index.html?s=${encodeURIComponent(p.ex)}" lang="ja" data-tip-ja="文の分析で開く" data-tip-en="Open in Breakdown"><span>${text}</span>${icon('arrowRight')}</a>`;
}

function matches(p, q) {
  if (levels.size && !levels.has(p.level)) return false;
  if (groups.size && !groups.has(p.group)) return false;
  if (logics.size && !logics.has(p.logic)) return false;
  if (!q) return true;
  const logic = LOGIC.find((l) => l.id === p.logic);
  return [p.id, p.label, p.en, p.ja, p.ex, logic?.ja, logic?.en].some((f) => f && fold(f).includes(q));
}

function render() {
  const chip = (set, key, id, text, title = '') =>
    `<button type="button" class="chip${set.has(id) ? ' active' : ''}" data-${key}="${id}" aria-pressed="${set.has(id)}"${title ? ` title="${esc(title)}"` : ''}>${text}</button>`;
  $('gr-levels').innerHTML = LEVELS.filter((l) => PATTERNS.some((p) => p.level === l))
    .map((l) => chip(levels, 'level', l, l === 'extra' ? esc(t('JLPT外', 'Other')) : l))
    .join('');
  summaries();
  const q = fold(search.value.trim());
  const html = GROUPS.map((g) => {
    const items = PATTERNS.filter((p) => p.group === g.id && matches(p, q));
    if (!items.length) return '';
    return `<section class="gr-group">
      <h2 class="section-title">${esc(tr(g))}</h2>
      <div class="gr-grid">${items
        .map(
          (p) => `<article class="card gr-card" id="${p.id}">
            <div class="gr-card-head"><span class="gr-label" lang="ja">${esc(p.label)}</span>${levelBadge(p.level)}${logicBadge(p)}</div>
            <div class="gr-meaning">${esc(t(p.ja, p.en))}</div>
            <div class="gr-meaning-alt">${esc(t(p.en, p.ja))}</div>
            ${exampleHtml(p)}
          </article>`
        )
        .join('')}</div>
    </section>`;
  }).join('');
  $('gr-list').innerHTML = html || `<div class="card empty-state">${esc(t('該当する文法がありません。', 'No grammar matches.'))}</div>`;
}

$('gr-levels').addEventListener('click', (e) => {
  const b = e.target.closest('[data-level]');
  if (!b) return;
  levels.has(b.dataset.level) ? levels.delete(b.dataset.level) : levels.add(b.dataset.level);
  render();
});

// Multi-select dropdowns (grammar group, logic function). The checklists are built
// once per language, so ticking a box doesn't rebuild the list you're working in.
const DROPDOWNS = [
  { key: 'group', set: groups, el: 'gr-groups', label: () => t('文法', 'Grammar'), items: () => GROUPS.map((g) => ({ id: g.id, text: tr(g) })) },
  { key: 'logic', set: logics, el: 'gr-logic', label: () => t('論理', 'Logic'), items: () => LOGIC.map((l) => ({ id: l.id, text: tr(l), hint: tr(l.hint) })) },
];

function buildPanels() {
  for (const d of DROPDOWNS) {
    $(d.el).innerHTML =
      d.items()
        .map(
          (it) => `<label class="ms-option"><input type="checkbox" data-${d.key}="${it.id}"${d.set.has(it.id) ? ' checked' : ''}>
            <span><span class="ms-text">${esc(it.text)}</span>${it.hint ? `<span class="ms-hint">${esc(it.hint)}</span>` : ''}</span></label>`
        )
        .join('') + `<button type="button" class="ms-clear" data-clear="${d.key}">${esc(t('選択を解除', 'Clear'))}</button>`;
  }
  summaries();
}

// "文法：すべて", the one choice, or "文法：3件".
function summaries() {
  for (const d of DROPDOWNS) {
    const items = d.items().filter((it) => d.set.has(it.id));
    const value = !items.length ? t('すべて', 'All') : items.length === 1 ? items[0].text : t(`${items.length}件`, `${items.length} selected`);
    const btn = $(d.el).previousElementSibling;
    btn.innerHTML = `<span class="ms-label">${esc(d.label())}</span><span class="ms-value">${esc(value)}</span>${icon('chevronDown')}`;
    btn.parentElement.classList.toggle('has-value', items.length > 0);
  }
}

for (const d of DROPDOWNS) {
  $(d.el).addEventListener('change', (e) => {
    const v = e.target.dataset[d.key];
    if (v == null) return;
    e.target.checked ? d.set.add(v) : d.set.delete(v);
    render();
  });
  $(d.el).addEventListener('click', (e) => {
    if (!e.target.closest('[data-clear]')) return;
    d.set.clear();
    $(d.el).querySelectorAll('input').forEach((i) => (i.checked = false));
    render();
  });
}
// One dropdown open at a time; close on an outside click or Escape.
const details = [...document.querySelectorAll('details.ms')];
details.forEach((el) =>
  el.addEventListener('toggle', () => {
    if (!el.open) return;
    details.forEach((o) => o !== el && (o.open = false));
    // Right-align the panel when it would run off the right edge.
    const panel = el.querySelector('.ms-panel');
    panel.classList.remove('flip');
    if (panel.getBoundingClientRect().right > document.documentElement.clientWidth - 8) panel.classList.add('flip');
  })
);
document.addEventListener('click', (e) => details.forEach((el) => el.open && !el.contains(e.target) && (el.open = false)));
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = details.find((el) => el.open);
  if (open) {
    open.open = false;
    open.querySelector('summary').focus();
  }
});
search.addEventListener('input', debounce(render, 120));
onPrefsChange((what) => {
  if (what !== 'lang') return;
  buildPanels();
  render();
});

onTokenizerState((state) => {
  const el = $('gr-status');
  el.dataset.state = state;
  el.innerHTML = state === 'loading' ? `${icon('loading')}${esc(t('例文を解析中…', 'Analyzing examples…'))}` : '';
});

buildPanels();
render();
// Deep link to a pattern (#te-iru): render first, then scroll.
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();

// Highlight each example's matched span.
(async () => {
  for (const p of PATTERNS) {
    try {
      const [s] = await analyze(p.ex);
      const m = s?.patterns.find((x) => x.id === p.id);
      if (m) spans.set(p.id, [s.tokens[m.start].start, s.tokens[m.end - 1].end]);
    } catch (_) {
      return; // tokenizer unavailable: examples stay plain
    }
  }
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
})();
