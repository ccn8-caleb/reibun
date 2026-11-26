// Breakdown: paste Japanese, see it split into words and phrases with furigana,
// word classes, phrase roles, the sentence skeleton, structure and grammar patterns.
// Tapping anything opens the inspector (conjugation chain, dictionary, notes).
//
// Deep link: index.html?s=<text> analyses <text> on load.

import { initPage } from '../core/hub.js';
import { t, tr, onPrefsChange } from '../core/prefs.js';
import { toast, isTyping, isCompact } from '../core/ui.js';
import { icon, hydrateIcons } from '../core/icons.js';
import { escapeHtml as esc, debounce, toHiragana } from '../core/util.js';
import { STORAGE_KEYS } from '../core/constants.js';
import { BUILD } from '../core/version.js';
import { lookup } from '../core/dict.js';
import { analyze, onTokenizerState, preloadTokenizer, tokenizerState } from '../engine/tokenizer.js';
import { KINDS, POS_GROUPS } from '../engine/tokens.js';
import { CONNECTORS } from '../engine/roles.js';
import { CLASSES, FORMS, summarize } from '../engine/conjugation.js';
import { PATTERN_BY_ID, LOGIC_BY_ID } from '../engine/patterns.js';
import { paragraphChart } from '../engine/discourse.js';
import { sentenceLineHtml, skeletonHtml, threadsHtml, drawThreads, focusThreads, logicChartHtml, patternChipsHtml, highlightTokens, rubyHtml, posGroup, roleOf, levelBadge, logicBadge } from './render.js';

const { store } = await initPage('breakdown');

const $ = (id) => document.getElementById(id);
const input = $('bd-text');
const output = $('bd-output');
const inspector = $('inspector');
const statusEl = $('bd-status');

let results = []; // analysed sentences
let selection = null; // { s, kind: 'token', index } | { s, kind: 'pattern', id }
let samples = [];
let showAllExamples = false;
let runSeq = 0;

// ---------------------------------------------------------------------------
// Display toggles
// ---------------------------------------------------------------------------
const view = { furigana: true, pos: true, roles: true, chart: true, threads: true };
try {
  Object.assign(view, JSON.parse(localStorage.getItem(STORAGE_KEYS.VIEW) || '{}'));
} catch (_) {}

function applyView() {
  output.classList.toggle('hide-furigana', !view.furigana);
  output.classList.toggle('show-pos', view.pos);
  output.classList.toggle('hide-roles', !view.roles);
  document.querySelectorAll('[data-view]').forEach((b) => {
    b.classList.toggle('active', view[b.dataset.view]);
    b.setAttribute('aria-pressed', String(view[b.dataset.view]));
  });
  $('bd-legend').hidden = !view.pos;
  renderChart();
}

document.querySelectorAll('[data-view]').forEach((b) =>
  b.addEventListener('click', () => {
    view[b.dataset.view] = !view[b.dataset.view];
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW, JSON.stringify(view));
    } catch (_) {}
    applyView();
  })
);

function renderLegend() {
  $('bd-legend').innerHTML = POS_GROUPS.map(
    (g) => `<span class="legend-item" style="color: var(--pos-${g.id})"><span class="legend-swatch"></span><span style="color: var(--text-muted)">${esc(tr(g))}</span></span>`
  ).join('');
}

// ---------------------------------------------------------------------------
// Tokenizer status
// ---------------------------------------------------------------------------
onTokenizerState((state, detail) => {
  statusEl.dataset.state = state;
  if (state === 'loading') {
    statusEl.innerHTML = `${icon('loading')}${esc(t('辞書を読み込み中…（初回のみ約18MB）', 'Loading the dictionary… (about 18 MB, first time only)'))}`;
  } else if (state === 'error') {
    statusEl.innerHTML = `${icon('alert')}${esc(t('辞書を読み込めませんでした: ', 'Could not load the dictionary: ') + detail)}`;
  } else statusEl.textContent = '';
});

// ---------------------------------------------------------------------------
// Examples
// ---------------------------------------------------------------------------
async function loadSamples() {
  try {
    const res = await fetch(`data/samples.json?v=${BUILD}`);
    samples = res.ok ? await res.json() : [];
  } catch (_) {
    samples = [];
  }
  renderExamples();
}

function renderExamples() {
  const few = isCompact() ? 3 : 6;
  const list = showAllExamples ? samples : samples.slice(0, few);
  $('bd-examples').innerHTML =
    `<span class="section-title">${esc(t('例文', 'Examples'))}</span>` +
    list
      .map(
        (s) =>
          `<button type="button" class="chip" data-example="${esc(s.id)}" title="${esc(s.en)}"><span class="level-badge" data-level="${s.level}">${s.level}</span><span class="chip-text" lang="ja">${esc(s.ja)}</span></button>`
      )
      .join('') +
    (samples.length > few
      ? `<button type="button" class="chip" id="bd-more-examples">${esc(showAllExamples ? t('閉じる', 'Fewer') : t(`ほか ${samples.length - few} 件`, `${samples.length - few} more`))}</button>`
      : '');
}

$('bd-examples').addEventListener('click', (e) => {
  if (e.target.closest('#bd-more-examples')) {
    showAllExamples = !showAllExamples;
    renderExamples();
    return;
  }
  const chip = e.target.closest('[data-example]');
  if (!chip) return;
  const s = samples.find((x) => x.id === chip.dataset.example);
  if (!s) return;
  input.value = s.ja;
  run();
});

const translationFor = (ja) => samples.find((s) => s.ja === ja)?.en || store.find(ja)?.en || '';

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------
async function run() {
  const text = input.value.trim();
  const seq = ++runSeq;
  saveDraft(text);
  if (!text) {
    results = [];
    render();
    return;
  }
  if (tokenizerState() !== 'ready') {
    output.innerHTML = `<div class="card empty-state">${icon('loading', { cls: 'spin' })}${esc(t('辞書の準備ができ次第、分析します…', 'Analyzing as soon as the dictionary is ready…'))}</div>`;
  }
  try {
    const res = await analyze(text);
    if (seq !== runSeq) return; // a newer run superseded this one
    results = res;
    selection = null;
    render();
  } catch (err) {
    if (seq !== runSeq) return;
    output.innerHTML = `<div class="card empty-state">${icon('alert')}${esc(t('分析できませんでした: ', 'Could not analyze: ') + err.message)}
      <button type="button" class="tb-btn" id="bd-retry">${esc(t('再試行', 'Try again'))}</button></div>`;
    $('bd-retry').addEventListener('click', run);
  }
}

function saveDraft(text) {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT, text);
  } catch (_) {}
  const url = new URL(location.href);
  if (text && text.length < 600) url.searchParams.set('s', text);
  else url.searchParams.delete('s');
  history.replaceState(null, '', url);
}

$('bd-run').addEventListener('click', run);
$('bd-clear').addEventListener('click', () => {
  input.value = '';
  run();
  input.focus();
});

// Typing: analyse after a pause, but never in the middle of IME composition.
let composing = false;
input.addEventListener('compositionstart', () => (composing = true));
input.addEventListener('compositionend', () => {
  composing = false;
  autoRun();
});
const autoRun = debounce(() => {
  if (!composing && tokenizerState() === 'ready') run();
}, 700);
input.addEventListener('input', () => !composing && autoRun());
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    run();
  }
});
input.addEventListener('focus', preloadTokenizer, { once: true });

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function render() {
  $('bd-toolbar').hidden = !results.length;
  if (!results.length) {
    output.innerHTML = '';
    renderInspector();
    return;
  }
  output.innerHTML = results
    .map((s, k) => {
      const en = translationFor(s.text);
      const saved = Boolean(store.find(s.text));
      return `<article class="card sentence-card" data-s="${k}">
        <div class="sentence-head">
          <span class="politeness">${esc(s.politeness === 'polite' ? t('丁寧体（です・ます）', 'Polite (です/ます)') : t('普通体', 'Plain form'))}</span>
          ${en ? `<span class="panel-hint">${esc(en)}</span>` : ''}
          <span class="spacer"></span>
          <button type="button" class="icon-btn small" data-save="${k}" aria-pressed="${saved}"
            aria-label="${esc(saved ? t('例文帳から外す', 'Remove from library') : t('例文帳に保存', 'Save to library'))}"
            data-tip-ja="${saved ? '例文帳から外す' : '例文帳に保存'}" data-tip-en="${saved ? 'Remove from library' : 'Save to library'}">${icon(saved ? 'bookmarkCheck' : 'bookmark')}</button>
        </div>
        ${sentenceLineHtml(s)}
        <div class="insp-section">
          <div class="section-title">${esc(t('文の骨組み', 'Skeleton'))}</div>
          ${skeletonHtml(s)}
        </div>
        <div class="insp-section">
          <div class="section-title">${esc(t('文法パターン', 'Grammar patterns'))}</div>
          ${patternChipsHtml(s)}
        </div>
        <details class="structure"${view.threads ? ' open' : ''}>
          <summary class="section-title">${esc(t('つながり（どの語がどこにかかるか）', 'Connections (what attaches to what)'))}</summary>
          ${threadsHtml(s)}
        </details>
      </article>`;
    })
    .join('');
  drawThreads(output);
  renderChart();
  applySelection();
  renderInspector();
}

// ---------------------------------------------------------------------------
// Logic chart (two or more sentences) and connection threads
// ---------------------------------------------------------------------------
function renderChart() {
  const chart = $('bd-chart');
  const show = view.chart && results.length >= 2;
  chart.hidden = !show;
  if (!show) return;
  chart.innerHTML = `<div class="section-title">${esc(t('論理の流れ', 'Logic flow'))}</div>${logicChartHtml(paragraphChart(results, input.value.trim()))}`;
}
$('bd-chart').addEventListener('click', (e) => {
  const k = e.target.closest('[data-goto-s]')?.dataset.gotoS;
  const card = k != null && output.querySelector(`.sentence-card[data-s="${k}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  card.classList.add('flash');
  setTimeout(() => card.classList.remove('flash'), 1200);
});

// Opening or closing a card's threads applies to every card and is remembered.
output.addEventListener(
  'toggle',
  (e) => {
    if (!e.target.matches?.('details.structure')) return;
    if (view.threads !== e.target.open) {
      view.threads = e.target.open;
      try {
        localStorage.setItem(STORAGE_KEYS.VIEW, JSON.stringify(view));
      } catch (_) {}
      output.querySelectorAll('details.structure').forEach((d) => (d.open = view.threads));
    }
    drawThreads(output);
    applySelection();
  },
  true
);
new ResizeObserver(() => drawThreads(output)).observe(output);

// ---------------------------------------------------------------------------
// Selection & inspector
// ---------------------------------------------------------------------------
function select(next) {
  selection = next;
  applySelection();
  renderInspector();
}

function applySelection() {
  output.querySelectorAll('.selected').forEach((el) => el.classList.remove('selected'));
  output.querySelectorAll('.tok.hl').forEach((el) => el.classList.remove('hl'));
  focusThreads(output, null);
  if (!selection) return;
  const card = output.querySelector(`[data-s="${selection.s}"]`);
  if (!card) return;
  const s = results[selection.s];
  if (selection.kind === 'token') {
    card.querySelector(`.tok[data-tok="${selection.index}"]`)?.classList.add('selected');
    const b = s.chunks.find((c) => c.tokens.some((x) => x.i === selection.index));
    if (b) card.querySelector(`.chunk[data-chunk="${b.id}"]`)?.classList.add('selected');
    if (b) focusThreads(card, b.id);
  } else {
    card.querySelector(`.pattern-chip[data-pattern="${selection.id}"]`)?.classList.add('selected');
    highlightTokens(card, s, selection.id);
  }
}

output.addEventListener('click', (e) => {
  const card = e.target.closest('[data-s]');
  if (!card) return;
  const k = Number(card.dataset.s);
  const s = results[k];
  const save = e.target.closest('[data-save]');
  if (save) return toggleSaved(s.text);
  const chip = e.target.closest('.pattern-chip');
  if (chip) return select({ s: k, kind: 'pattern', id: chip.dataset.pattern });
  const tok = e.target.closest('.tok');
  if (tok) return select({ s: k, kind: 'token', index: Number(tok.dataset.tok) });
  const chunkEl = e.target.closest('[data-chunk]');
  if (chunkEl) {
    const b = s.chunks[Number(chunkEl.dataset.chunk)];
    return select({ s: k, kind: 'token', index: b.tokens[b.head].i });
  }
});

// Hovering a pattern chip previews its span.
output.addEventListener('mouseover', (e) => {
  const chip = e.target.closest('.pattern-chip');
  if (!chip) return;
  const card = chip.closest('[data-s]');
  highlightTokens(card, results[Number(card.dataset.s)], chip.dataset.pattern);
});
output.addEventListener('mouseout', (e) => {
  if (e.target.closest('.pattern-chip')) applySelection();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && selection && !isTyping()) select(null);
});

function toggleSaved(text) {
  const existing = store.find(text);
  if (existing) {
    const removed = store.remove(existing.id);
    toast(t('例文帳から外しました', 'Removed from library'), { action: { label: t('元に戻す', 'Undo'), run: () => store.restore(removed) } });
  } else {
    store.add({ ja: text, en: samples.find((s) => s.ja === text)?.en || '' });
    toast(t('例文帳に保存しました', 'Saved to library'));
  }
}
store.onChange(() => results.length && render());

const sectionHtml = (title, body) => `<div class="insp-section"><div class="section-title">${esc(title)}</div>${body}</div>`;

function renderInspector() {
  inspector.classList.toggle('idle', !selection);
  if (!selection) {
    inspector.innerHTML = `<div class="insp-empty">${
      results.length
        ? esc(t('語・文節・文法パターンをタップすると、ここに詳しい説明が出ます。', 'Tap a word, phrase or grammar pattern to see the details here.'))
        : esc(
            t(
              '文を入力すると、語・文節・役割・活用・文法パターンに分解します。辞書と解析はすべてブラウザ内で動きます。',
              'Enter a sentence to break it into words, phrases, roles, conjugations and grammar patterns. The dictionary and analysis run entirely in your browser.'
            )
          )
    }</div>`;
    return;
  }
  const s = results[selection.s];
  if (selection.kind === 'pattern') renderPatternInspector(s, selection.id);
  else renderTokenInspector(s, s.tokens[selection.index]);
  inspector.querySelector('.inspector-close')?.addEventListener('click', () => select(null));
  hydrateIcons(inspector);
}

const closeBtn = () => `<button type="button" class="icon-btn small inspector-close" aria-label="${esc(t('閉じる', 'Close'))}">${icon('close')}</button>`;

function renderPatternInspector(s, id) {
  const p = PATTERN_BY_ID.get(id);
  const text = s.patterns
    .filter((m) => m.id === id)
    .map((m) => `「${s.tokens.slice(m.start, m.end).map((x) => x.surface).join('')}」`)
    .join(' ');
  inspector.innerHTML = `
    <div class="inspector-head">
      <div>
        <div class="insp-word" lang="ja">${esc(p.label)}</div>
        <div class="insp-sub">${levelBadge(p.level)}${logicBadge(p)}<span lang="ja">${esc(text)}</span></div>
      </div>
      ${closeBtn()}
    </div>
    ${sectionHtml(t('意味', 'Meaning'), `<p>${esc(t(p.ja, p.en))}</p><p class="muted">${esc(t(p.en, p.ja))}</p>`)}
    ${p.logic ? sectionHtml(t('論理の働き', 'Role in an argument'), `<p>${logicBadge(p)} ${esc(tr(LOGIC_BY_ID.get(p.logic).hint))}</p>`) : ''}
    ${sectionHtml(t('例文', 'Example'), `<a class="gr-example" href="index.html?s=${encodeURIComponent(p.ex)}" lang="ja"><span>${esc(p.ex)}</span>${icon('arrowRight')}</a>`)}
    <div class="insp-links"><a class="tb-btn" href="grammar.html#${esc(p.id)}">${icon('dictionary')}${esc(t('文法一覧で見る', 'Open in Grammar'))}</a></div>`;
}

function renderTokenInspector(s, tok) {
  const b = s.chunks.find((c) => c.tokens.includes(tok));
  const kind = KINDS[tok.kind] || KINDS.other;
  const role = roleOf(b);
  const conn = CONNECTORS[b.roleInfo.connector];
  const attachTo = b.dep >= 0 ? s.chunks[b.dep] : null;
  const ipadic = [tok.pos, tok.pos1, tok.pos2].filter(Boolean).join('・');
  const patterns = [...new Set(s.patterns.filter((m) => tok.i >= m.start && tok.i < m.end).map((m) => m.id))];

  const phrase = `
    <p><span class="pos-badge" style="--tone: var(--role-${role.tone})">${esc(tr(role))}</span>
      <span lang="ja">「${esc(b.text)}」</span></p>
    <p>${esc(tr(role.hint))}</p>
    ${conn ? `<p><strong lang="ja">${esc(b.roleInfo.connector)}</strong>: ${esc(tr(conn))}</p>` : ''}
    ${b.roleInfo.topic ? `<p class="muted">${esc(t('「は」が付いて話題にもなっています。', 'は also makes it the topic.'))}</p>` : ''}
    ${attachTo ? `<p class="muted">${esc(t('かかり先', 'Attaches to'))}: <span lang="ja">「${esc(attachTo.text.replace(/[。、]$/, ''))}」</span></p>` : ''}`;

  inspector.innerHTML = `
    <div class="inspector-head">
      <div>
        <div class="insp-word" lang="ja">${rubyHtml(tok.surface, tok.reading)}</div>
        <div class="insp-sub">
          <span class="pos-badge pos-${posGroup(tok)}">${esc(tr(kind))}</span>
          ${tok.base !== tok.surface ? `<span>${esc(t('基本形', 'Dictionary form'))}: <strong lang="ja">${esc(tok.base)}</strong></span>` : ''}
          <span class="muted" lang="ja">${esc(ipadic)}</span>
        </div>
      </div>
      ${closeBtn()}
    </div>
    ${sectionHtml(t('文節の役割', 'Role of the phrase'), phrase)}
    ${b.conj ? sectionHtml(t('活用', 'Conjugation'), chainHtml(b)) : ''}
    ${patterns.length ? sectionHtml(t('この語を含む文法', 'Grammar involving this word'), `<div class="pattern-row">${patterns
      .map((id) => {
        const p = PATTERN_BY_ID.get(id);
        return `<button type="button" class="pattern-chip" data-insp-pattern="${id}">${levelBadge(p.level)}<span lang="ja">${esc(p.label)}</span>${logicBadge(p)}</button>`;
      })
      .join('')}</div>`) : ''}
    <div class="insp-section" id="insp-dict"></div>`;

  inspector.querySelectorAll('[data-insp-pattern]').forEach((el) =>
    el.addEventListener('click', () => select({ s: selection.s, kind: 'pattern', id: el.dataset.inspPattern }))
  );
  fillDictionary(tok, b);
}

function chainHtml(b) {
  const c = b.conj;
  const head = b.tokens.find((x) => x.i === c.head);
  const cls = CLASSES[c.cls];
  const form = FORMS[head.cform];
  const steps = [
    `<div class="chain-step head"><span class="chain-surface" lang="ja">${esc(head.surface)}</span><span class="chain-label"><span lang="ja">${esc(c.base)}</span> · ${esc(tr(cls))}${
      form ? `<small>${esc(tr(form))}</small>` : ''
    }</span></div>`,
    ...c.layers.map(
      (l) =>
        `<div class="chain-step"><span class="chain-surface" lang="ja">${esc(l.surface)}</span><span class="chain-label">${esc(
          l.connector && CONNECTORS[l.connector] ? tr(CONNECTORS[l.connector]) : tr(l)
        )}</span></div>`
    ),
  ];
  return `<div class="chain">${steps.join('')}</div><p class="muted">${esc(summarize(c, t))}</p>`;
}

// Dictionary: JMdict shards (deployed builds). Particles and auxiliaries are
// grammar, not vocabulary, so they skip the lookup.
async function fillDictionary(tok, b) {
  const slot = $('insp-dict');
  if (!slot) return;
  if (['particle', 'auxiliary', 'symbol'].includes(tok.kind)) {
    slot.remove();
    return;
  }
  const suruNoun = b.conj?.cls === 'suru-noun' && b.conj.head === tok.i ? b.conj.base.replace(/(する|できる|出来る)$/, '') : null;
  const word = suruNoun || tok.base;
  const jisho = `<div class="insp-links"><a class="tb-btn" href="https://jisho.org/search/${encodeURIComponent(word)}" target="_blank" rel="noopener noreferrer">${icon('external')}Jisho</a></div>`;
  slot.innerHTML = `<div class="section-title">${esc(t('辞書', 'Dictionary'))}</div><span class="insp-empty">${icon('loading')}</span>`;
  let entries;
  try {
    entries = await lookup(word);
  } catch (_) {
    entries = undefined;
  }
  if (!slot.isConnected) return;
  let body;
  if (entries === null) body = `<p class="insp-empty">${esc(t('辞書データがありません（ローカル開発時）。', 'No dictionary data here (local development build).'))}</p>`;
  else if (entries === undefined) body = `<p class="insp-empty">${esc(t('辞書を読み込めませんでした（オフライン？）。', 'Could not load the dictionary (offline?).'))}</p>`;
  else if (!entries.length) body = `<p class="insp-empty">${esc(t('辞書に見つかりませんでした。', 'Not found in the dictionary.'))}</p>`;
  else {
    const want = toHiragana(tok.reading);
    const sorted = [...entries].sort((x, y) => Number(y.r.some((r) => toHiragana(r) === want)) - Number(x.r.some((r) => toHiragana(r) === want)));
    body = sorted
      .slice(0, 3)
      .map(
        (e) => `<div class="dict-entry"><span class="dict-reading" lang="ja">${esc(e.r.join('・'))}</span>${e.s
          .map((sense, k) => `<div>${e.s.length > 1 ? `${'①②③④⑤'[k]} ` : ''}${esc(sense.g)} <span class="dict-pos">${esc(sense.p.join(', '))}</span></div>`)
          .join('')}</div>`
      )
      .join('');
  }
  slot.innerHTML = `<div class="section-title">${esc(t('辞書', 'Dictionary'))}${suruNoun ? ` · <span lang="ja">${esc(suruNoun)}</span>` : ''}</div>${body}${jisho}`;
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
onPrefsChange((what) => {
  if (what !== 'lang') return;
  renderLegend();
  renderExamples();
  render();
});

renderLegend();
applyView();
renderInspector();
loadSamples();

const initial = new URL(location.href).searchParams.get('s') ?? (() => {
  try {
    return localStorage.getItem(STORAGE_KEYS.DRAFT) || '';
  } catch (_) {
    return '';
  }
})();
input.value = initial;
if (initial.trim()) run();
else preloadTokenizer(); // warm up so the first analysis is instant
