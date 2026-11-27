// Reading (読解): read a passage with pens, then answer questions about it.
//
// Pens: pick one (topic/subject, predicate, connector, key point), select words to
// mark them, tap a mark to erase it, then Check: Reibun grades each mark against its
// own analysis (engine/highlight.js) and lists what it would also have marked.
// "Reibun's marks" shows its answer key.
//
// Questions (engine/reading.js): hand-written ones for the sample passages, plus a
// logic question for every sentence that opens with a linking word, on any passage.
// For each, pick an answer and (optionally) tap the sentence that proves it.
//
// The passage, marks and answers are kept in localStorage (one passage at a time).

import { initPage } from '../core/hub.js';
import { t, tr, onPrefsChange } from '../core/prefs.js';
import { icon, hydrateIcons } from '../core/icons.js';
import { escapeHtml as esc } from '../core/util.js';
import { STORAGE_KEYS } from '../core/constants.js';
import { BUILD } from '../core/version.js';
import { analyze, onTokenizerState, preloadTokenizer, tokenizerState } from '../engine/tokenizer.js';
import { PENS, PEN_BY_ID, answerKey, checkMarks, snapToTokens } from '../engine/highlight.js';
import { LOGIC_BY_ID } from '../engine/patterns.js';
import { prepareQuestions, grade } from '../engine/reading.js';
import { rubyHtml, levelBadge } from './render.js';

await initPage('highlight');

const $ = (id) => document.getElementById(id);
const passageEl = $('hl-passage');

const state = { text: '', marks: [], pen: 'subject', furigana: true, reveal: false, answers: {}, checked: false };
let sentences = []; // analysed passage
let report = null; // last checkMarks() result, cleared when marks change
let samples = [];
let samplesReady = null; // promise: data/passages.json loaded
let questions = []; // prepareQuestions() for the current passage
let pickFor = null; // question id whose evidence sentence is being picked
let showEvidence = null; // question id whose evidence is highlighted
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
      state.answers = saved.answers && typeof saved.answers === 'object' ? saved.answers : {};
      state.checked = Boolean(saved.checked);
      nextId = Math.max(0, ...state.marks.map((m) => m.id || 0)) + 1;
    }
  } catch (_) {}
}
function save() {
  try {
    const { text, marks, pen, furigana, answers, checked } = state;
    localStorage.setItem(STORAGE_KEYS.HIGHLIGHT, JSON.stringify({ text, marks, pen, furigana, answers, checked }));
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

function loadSamples() {
  samplesReady = fetchSamples();
  return samplesReady;
}
async function fetchSamples() {
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
  if (text !== state.text) {
    state.marks = [];
    state.answers = {};
    state.checked = false;
  }
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
    await samplesReady;
    const sample = samples.find((p) => p.ja === state.text);
    questions = prepareQuestions(sentences, state.text, sample?.questions || []);
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
      if (evidenceHere(sentences.indexOf(s))) cls.push('ev');
      html += `<span class="${cls.join(' ')}" data-a="${a}" data-b="${b}" data-s="${sentences.indexOf(s)}"${m ? ` data-mark="${m.id}"` : ''}>${rubyHtml(tok.surface, tok.reading)}</span>`;
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
  renderQuestions();
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
passageEl.addEventListener('pointerup', () => setTimeout(() => !pickFor && onSelect(), 0));
passageEl.addEventListener('keyup', (e) => e.shiftKey && onSelect());
passageEl.addEventListener('click', (e) => {
  if (pickFor) return pickEvidence(tokOf(e.target));
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

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------
// Sentence k is lit: the one being picked for, or a question's evidence on request.
function evidenceHere(k) {
  if (pickFor) return false;
  const q = showEvidence && questions.find((x) => x.id === showEvidence);
  return Boolean(q && q.evidence.includes(k));
}
const sentenceText = (k) => sentences[k]?.text || '';
const optionText = (q, n) => (q.kind === 'logic' ? tr(LOGIC_BY_ID.get(q.logicOptions[n])) : q.options[n]);
// Written questions stay in Japanese (reading them is part of the practice); in English
// mode their translation appears underneath.
const gloss = (text) => (t('', text) && text ? `<span class="rc-gloss">${esc(text)}</span>` : '');

function renderQuestions() {
  const box = $('rc');
  if (!questions.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  passageEl.classList.toggle('picking', Boolean(pickFor));
  const results = state.checked ? questions.map((q) => grade(q, state.answers[q.id] || {})) : [];
  const right = results.filter((r) => r.right).length;
  const cards = questions
    .map((q, n) => {
      const a = state.answers[q.id] || {};
      const r = results[n];
      const opts = q.logicOptions || q.options;
      const options = opts
        .map((_, i) => {
          const cls = ['rc-option'];
          if (a.choice === i) cls.push('chosen');
          if (r && i === q.answer) cls.push('right');
          if (r && a.choice === i && !r.right) cls.push('wrong');
          return `<button type="button" class="${cls.join(' ')}" data-choice="${i}" ${state.checked ? 'disabled' : ''}><span class="dr-num">${i + 1}</span><span class="rc-opt-text"><span${q.kind === 'logic' ? '' : ' lang="ja"'}>${esc(optionText(q, i))}</span>${gloss(q.en?.options?.[i])}</span></button>`;
        })
        .join('');
      const ev = a.evidence != null
        ? `<span class="rc-ev-chip${r ? (r.evidenceRight ? ' right' : ' wrong') : ''}"><span class="rc-ev-label">${esc(t(`根拠：第${a.evidence + 1}文`, `Evidence: sentence ${a.evidence + 1}`))}</span><span lang="ja">「${esc(sentenceText(a.evidence).slice(0, 18))}${sentenceText(a.evidence).length > 18 ? '…' : ''}」</span></span>`
        : '';
      const pickBtn = state.checked
        ? `<button type="button" class="tb-btn" data-show="${q.id}">${icon('reveal')}${esc(showEvidence === q.id ? t('根拠を隠す', 'Hide evidence') : t('根拠を見る', 'Show evidence'))}</button>`
        : `<button type="button" class="tb-btn${pickFor === q.id ? ' primary' : ''}" data-pick="${q.id}">${icon('highlighter')}${esc(pickFor === q.id ? t('文章の中の文をタップ…', 'Tap a sentence in the passage…') : t('根拠の文を選ぶ', 'Pick the evidence'))}</button>`;
      const verdict = r
        ? `<p class="rc-verdict ${r.right ? 'right' : 'wrong'}">${icon(r.right ? 'check' : 'close')}${esc(r.right ? t('正解', 'Correct') : t('不正解', 'Not quite'))}${
            r.evidenceRight === null ? '' : `<span class="muted"> · ${esc(r.evidenceRight ? t('根拠も正しい', 'right evidence') : t(`根拠は第${q.evidence.map((k) => k + 1).join('・')}文`, `evidence is sentence ${q.evidence.map((k) => k + 1).join(', ')}`))}</span>`
          }</p><p class="rc-explain">${esc(tr(q.explain))}</p>`
        : '';
      return `<article class="rc-q" data-q="${q.id}">
        <div class="rc-head"><span class="rc-num">${esc(t(`問${n + 1}`, `Q${n + 1}`))}</span>${q.kind === 'logic' ? `<span class="rc-kind">${esc(t('論理', 'Logic'))}</span>` : ''}</div>
        <p class="rc-prompt"${q.kind === 'logic' ? '' : ' lang="ja"'}>${esc(typeof q.prompt === 'string' ? q.prompt : tr(q.prompt))}</p>${gloss(q.en?.q)}
        <div class="rc-options">${options}</div>
        <div class="rc-ev">${pickBtn}${ev}</div>
        ${verdict}
      </article>`;
    })
    .join('');
  const answered = questions.filter((q) => state.answers[q.id]?.choice != null).length;
  box.innerHTML = `
    <div class="rc-top"><span class="section-title">${esc(t('読解問題', 'Questions'))}</span>
      ${state.checked ? `<span class="rc-score">${esc(t(`${questions.length}問中 ${right}問正解`, `${right} of ${questions.length} correct`))}</span>` : `<span class="muted">${esc(t(`${answered} / ${questions.length} 回答済み`, `${answered} / ${questions.length} answered`))}</span>`}</div>
    ${cards}
    <div class="hl-actions">
      ${state.checked
        ? `<button type="button" class="tb-btn" id="rc-reset">${icon('reset')}${esc(t('もう一度解く', 'Try again'))}</button>`
        : `<button type="button" class="tb-btn primary" id="rc-check" ${answered ? '' : 'disabled'}>${icon('check')}${esc(t('答え合わせ', 'Check answers'))}</button>`}
    </div>`;
}

function pickEvidence(el) {
  const k = el ? Number(el.dataset.s) : NaN;
  if (Number.isInteger(k)) state.answers[pickFor] = { ...(state.answers[pickFor] || {}), evidence: k };
  const card = $('rc').querySelector(`[data-q="${pickFor}"]`);
  pickFor = null;
  save();
  renderPassage();
  renderQuestions();
  card && $('rc').querySelector(`[data-q="${card.dataset.q}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

$('rc').addEventListener('click', (e) => {
  const card = e.target.closest('[data-q]');
  const id = card?.dataset.q;
  const choice = e.target.closest('[data-choice]');
  if (choice && id && !state.checked) {
    state.answers[id] = { ...(state.answers[id] || {}), choice: Number(choice.dataset.choice) };
    save();
    return renderQuestions();
  }
  const pick = e.target.closest('[data-pick]');
  if (pick) {
    pickFor = pickFor === pick.dataset.pick ? null : pick.dataset.pick;
    renderPassage();
    renderQuestions();
    if (pickFor) passageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  const show = e.target.closest('[data-show]');
  if (show) {
    showEvidence = showEvidence === show.dataset.show ? null : show.dataset.show;
    renderPassage();
    renderQuestions();
    if (showEvidence) passageEl.querySelector('.tok.ev')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (e.target.closest('#rc-check')) {
    state.checked = true;
    pickFor = null;
    save();
    return renderQuestions();
  }
  if (e.target.closest('#rc-reset')) {
    state.answers = {};
    state.checked = false;
    showEvidence = null;
    save();
    renderPassage();
    return renderQuestions();
  }
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
