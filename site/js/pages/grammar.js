// Grammar: the pattern catalog the analyser knows, grouped and filterable (by level,
// grammar group and logic function — any chip within a row, all rows together), each
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
  $('gr-groups').innerHTML = GROUPS.map((g) => chip(groups, 'group', g.id, esc(tr(g)))).join('');
  $('gr-logic').innerHTML = LOGIC.map((l) => chip(logics, 'logic', l.id, esc(tr(l)), tr(l.hint))).join('');
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

// Chip rows: click toggles that chip within its row.
for (const [id, set, key] of [['gr-levels', levels, 'level'], ['gr-groups', groups, 'group'], ['gr-logic', logics, 'logic']]) {
  $(id).addEventListener('click', (e) => {
    const b = e.target.closest(`[data-${key}]`);
    if (!b) return;
    const v = b.dataset[key];
    set.has(v) ? set.delete(v) : set.add(v);
    render();
  });
}
search.addEventListener('input', debounce(render, 120));
onPrefsChange((what) => what === 'lang' && render());

onTokenizerState((state) => {
  const el = $('gr-status');
  el.dataset.state = state;
  el.innerHTML = state === 'loading' ? `${icon('loading')}${esc(t('例文を解析中…', 'Analyzing examples…'))}` : '';
});

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
