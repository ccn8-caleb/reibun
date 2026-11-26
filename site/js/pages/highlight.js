// Highlighter: read a passage with pens. Pick a pen (topic/subject, predicate,
// connector, key point), select words to mark them, tap a mark to erase it, then
// Check: Reibun grades each mark against its own analysis (engine/highlight.js) and
// lists what it would also have marked. "Reibun's marks" shows its answer key.
//
// The passage and marks are kept in localStorage (one passage at a time).

import { initPage } from '../core/hub.js';
import { t, tr, onPrefsChange } from '../core/prefs.js';
import { icon, hydrateIcons } from '../core/icons.js';
import { escapeHtml as esc } from '../core/util.js';
import { STORAGE_KEYS } from '../core/constants.js';
import { BUILD } from '../core/version.js';
import { analyze, onTokenizerState, preloadTokenizer, tokenizerState } from '../engine/tokenizer.js';
import { PENS, PEN_BY_ID, answerKey, checkMarks, snapToTokens } from '../engine/highlight.js';
import { LOGIC_BY_ID } from '../engine/patterns.js';
import { rubyHtml, levelBadge } from './render.js';

await initPage('highlight');

const $ = (id) => document.getElementById(id);
const passageEl = $('hl-passage');

const state = { text: '', marks: [], pen: 'subject', furigana: true, reveal: false };
let sentences = []; // analysed passage
let report = null; // last checkMarks() result, cleared when marks change
let samples = [];
let nextId = 1;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.HIGHLIGHT) || 'null');
    if (saved && typeof saved.text === 'string') {
      Object.assign(state, saved, { reveal: false });
      state.marks = (saved.marks || []).filter((m) => PEN_BY_ID.has(m.type) && m.end > m.start);
      nextId = Math.max(0, ...state.marks.map((m) => m.id || 0)) + 1;
    }
  } catch (_) {}
}
function save() {
  try {
    const { text, marks, pen, furigana } = state;
    localStorage.setItem(STORAGE_KEYS.HIGHLIGHT, JSON.stringify({ text, marks, pen, furigana }));
  } catch (_) {}
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
onTokenizerState((s, detail) => {
  const el = $('hl-status');
  el.dataset.state = s;
  el.innerHTML =
    s === 'loading'
      ? `${icon('loading')}${esc(t('辞書を読み込み中…（初回のみ約18MB）', 'Loading the dictionary… (about 18 MB, first time only)'))}`
      : s === 'error'
        ? `${icon('alert')}${esc(t('辞書を読み込めませんでした: ', 'Could not load the dictionary: ') + detail)}`
        : '';
});

async function loadSamples() {
  try {
    const res = await fetch(`data/passages.json?v=${BUILD}`);
    samples = res.ok ? await res.json() : [];
  } catch (_) {
    samples = [];
  }
  renderSamples();
}
function renderSamples() {
  $('hl-samples').innerHTML =
    `<span class="section-title">${esc(t('例の文章', 'Sample passages'))}</span>` +
    samples.map((p) => `<button type="button" class="chip" data-sample="${esc(p.id)}">${levelBadge(p.level)}<span class="chip-text" lang="ja">${esc(tr(p.title))}</span></button>`).join('');
}
$('hl-samples').addEventListener('click', (e) => {
  const p = samples.find((x) => x.id === e.target.closest('[data-sample]')?.dataset.sample);
  if (!p) return;
  $('hl-text').value = p.ja;
  start();
});

async function start() {
  const text = $('hl-text').value.trim();
  if (!text) return;
  if (text !== state.text) state.marks = [];
  state.text = text;
  report = null;
  save();
  await openReader();
}

async function openReader() {
  $('hl-input-card').hidden = true;
  $('hl-reader').hidden = false;
  if (tokenizerState() !== 'ready') passageEl.innerHTML = `<span class="muted">${icon('loading', { cls: 'spin' })} ${esc(t('分析中…', 'Analyzing…'))}</span>`;
  try {
    sentences = await analyze(state.text);
  } catch (err) {
    passageEl.innerHTML = `${icon('alert')} ${esc(t('分析できませんでした: ', 'Could not analyze: ') + err.message)}`;
    return;
  }
  render();
}

$('hl-start').addEventListener('click', start);
$('hl-text').addEventListener('focus', preloadTokenizer, { once: true });
$('hl-text').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    start();
  }
});
$('hl-edit').addEventListener('click', () => {
  $('hl-text').value = state.text;
  $('hl-reader').hidden = true;
  $('hl-input-card').hidden = false;
  $('hl-text').focus();
});
$('hl-clear').addEventListener('click', () => {
  if (!state.marks.length) return;
  state.marks = [];
  changed();
});

// ---------------------------------------------------------------------------
// Pens & toggles
// ---------------------------------------------------------------------------
function renderPens() {
  $('hl-pens').innerHTML = PENS.map(
    (p) => `<button type="button" class="hl-pen pen-${p.id}${state.pen === p.id ? ' active' : ''}" role="radio" aria-checked="${state.pen === p.id}" data-pen="${p.id}" title="${esc(tr(p.hint))}">
      <span class="hl-swatch"></span>${esc(tr(p))}</button>`
  ).join('');
  $('hl-help').textContent = t(
    `${tr(PEN_BY_ID.get(state.pen))}：${tr(PEN_BY_ID.get(state.pen).hint)}。語を選ぶと印が付き、印をタップすると消えます。`,
    `${tr(PEN_BY_ID.get(state.pen))}: ${tr(PEN_BY_ID.get(state.pen).hint)}. Select words to mark them; tap a mark to erase it.`
  );
}
$('hl-pens').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pen]');
  if (!b) return;
  state.pen = b.dataset.pen;
  save();
  renderPens();
});
function applyToggles() {
  passageEl.classList.toggle('hide-furigana', !state.furigana);
  passageEl.classList.toggle('reveal', state.reveal);
  for (const [id, on] of [['hl-furigana', state.furigana], ['hl-reveal', state.reveal]]) {
    $(id).classList.toggle('active', on);
    $(id).setAttribute('aria-pressed', String(on));
  }
}
$('hl-furigana').addEventListener('click', () => {
  state.furigana = !state.furigana;
  save();
  applyToggles();
});
$('hl-reveal').addEventListener('click', () => {
  state.reveal = !state.reveal;
  applyToggles();
});

// ---------------------------------------------------------------------------
// The passage: every token is a span with its offsets in the whole text
// ---------------------------------------------------------------------------
const markAt = (start, end) => state.marks.find((m) => m.start < end && start < m.end);

function renderPassage() {
  const key = answerKey(sentences);
  const verdictOf = new Map((report?.results || []).map((r) => [r.mark.id, r.verdict]));
  let html = '';
  let pos = 0;
  const gap = (to) => {
    if (to > pos) html += esc(state.text.slice(pos, to)).replace(/\n/g, '<br>');
    pos = Math.max(pos, to);
  };
  for (const s of sentences) {
    for (const tok of s.tokens) {
      const a = s.offset + tok.start;
      const b = s.offset + tok.end;
      gap(a);
      const m = markAt(a, b);
      const k = key.filter((it) => it.start < b && a < it.end && (it.type !== 'predicate' || it.main)).map((it) => `key-${it.type}`);
      const cls = ['tok'];
      if (m) {
        cls.push('mk', `pen-${m.type}`);
        if (a === m.start) cls.push('mk-first');
        if (b === m.end) cls.push('mk-last');
        if (verdictOf.has(m.id)) cls.push(`v-${verdictOf.get(m.id)}`);
      }
      cls.push(...new Set(k));
      html += `<span class="${cls.join(' ')}" data-a="${a}" data-b="${b}"${m ? ` data-mark="${m.id}"` : ''}>${rubyHtml(tok.surface, tok.reading)}</span>`;
      pos = b;
    }
  }
  gap(state.text.length);
  passageEl.innerHTML = html;
}

function render() {
  renderPens();
  renderPassage();
  applyToggles();
  renderFeedback();
}

function changed() {
  report = null;
  save();
  renderPassage();
  renderFeedback();
}

// Selecting words applies the current pen; a plain tap on a mark erases it.
function tokOf(node) {
  const el = node?.nodeType === 1 ? node : node?.parentElement;
  return el?.closest('#hl-passage .tok');
}
function onSelect() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return false;
  const r = sel.getRangeAt(0);
  if (!passageEl.contains(r.commonAncestorContainer)) return false;
  const toks = [...passageEl.querySelectorAll('.tok')].filter((el) => r.intersectsNode(el));
  if (!toks.length) return false;
  const span = snapToTokens(sentences, Number(toks[0].dataset.a), Number(toks[toks.length - 1].dataset.b));
  sel.removeAllRanges();
  if (!span) return false;
  // A new mark replaces any it overlaps.
  state.marks = state.marks.filter((m) => !(m.start < span.end && span.start < m.end));
  state.marks.push({ id: nextId++, type: state.pen, ...span });
  state.marks.sort((a, b) => a.start - b.start);
  changed();
  return true;
}
passageEl.addEventListener('pointerup', () => setTimeout(() => onSelect(), 0));
passageEl.addEventListener('keyup', (e) => e.shiftKey && onSelect());
passageEl.addEventListener('click', (e) => {
  if (window.getSelection()?.isCollapsed === false) return;
  const el = tokOf(e.target);
  if (!el?.dataset.mark) return;
  const id = Number(el.dataset.mark);
  state.marks = state.marks.filter((m) => m.id !== id);
  changed();
});

// ---------------------------------------------------------------------------
// Checking
// ---------------------------------------------------------------------------
const VERDICT = {
  good: { icon: 'check', ja: '正解', en: 'Right' },
  close: { icon: 'alert', ja: '惜しい', en: 'Close' },
  miss: { icon: 'close', ja: '違う', en: 'Not quite' },
  note: { icon: 'edit', ja: 'メモ', en: 'Note' },
};
const verdictIcon = (v) => `<span class="hl-verdict v-${v}" title="${esc(tr(VERDICT[v]))}">${icon(VERDICT[v].icon)}</span>`;
const markText = (m) => state.text.slice(m.start, m.end);

$('hl-check').addEventListener('click', () => {
  if (!state.marks.length) {
    $('hl-feedback').hidden = false;
    $('hl-feedback').innerHTML = `<p>${esc(t('まだ印がありません。ペンを選んで、語を選択してください。', 'No marks yet. Pick a pen and select some words.'))}</p>`;
    return;
  }
  report = checkMarks(sentences, state.marks);
  renderPassage();
  renderFeedback();
  $('hl-feedback').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

function renderFeedback() {
  const box = $('hl-feedback');
  if (!report) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  const { results, missed, counts } = report;
  const graded = counts.good + counts.close + counts.miss;
  const tally = ['good', 'close', 'miss'].map((v) => `<span class="hl-tally">${verdictIcon(v)}${esc(tr(VERDICT[v]))} ${counts[v]}</span>`).join('');
  const summary = graded ? `<span>${esc(t(`${graded}個を採点`, `${graded} graded`))}</span>${tally}` : esc(t('採点対象の印はありません。', 'Nothing to grade.'));
  const rows = results
    .map((r) => {
      const pen = PEN_BY_ID.get(r.mark.type);
      return `<li class="hl-result v-${r.verdict}" data-goto="${r.mark.id}">
        ${verdictIcon(r.verdict)}
        <span class="hl-pen-tag pen-${pen.id}">${esc(tr(pen))}</span>
        <span lang="ja" class="hl-quote">「${esc(markText(r.mark))}」</span>
        <span class="hl-msg">${esc(tr(r.message))}</span></li>`;
    })
    .join('');
  const missedHtml = missed.length
    ? `<div class="section-title">${esc(t('Reibunはここにも印を付けます', 'Reibun would also mark'))}</div>
       <div class="hl-missed">${missed
         .map((it) => {
           const pen = PEN_BY_ID.get(it.type);
           const logic = it.logic ? LOGIC_BY_ID.get(it.logic) : null;
           return `<span class="hl-pen-tag pen-${pen.id}">${esc(tr(pen))}${logic ? ` · ${esc(tr(logic))}` : ''}</span><span lang="ja" class="hl-quote">「${esc(it.text)}」</span>`;
         })
         .map((x) => `<span class="hl-missed-item">${x}</span>`)
         .join('')}</div>`
    : `<p class="muted">${esc(t('主語・述語・つなぎはすべて見つけられました。', 'You found every topic/subject, main predicate and connector.'))}</p>`;
  box.hidden = false;
  box.innerHTML = `<div class="hl-summary">${summary}</div><ul class="hl-results">${rows}</ul>${missedHtml}`;
}
$('hl-feedback').addEventListener('click', (e) => {
  const id = e.target.closest('[data-goto]')?.dataset.goto;
  const el = id && passageEl.querySelector(`[data-mark="${id}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const all = passageEl.querySelectorAll(`[data-mark="${id}"]`);
  all.forEach((x) => x.classList.add('flash'));
  setTimeout(() => all.forEach((x) => x.classList.remove('flash')), 1200);
});

onPrefsChange((what) => {
  if (what !== 'lang') return;
  renderSamples();
  if (!$('hl-reader').hidden) render();
});

// ---------------------------------------------------------------------------
load();
loadSamples();
hydrateIcons(document.body);
if (state.text) {
  $('hl-text').value = state.text;
  openReader();
}
