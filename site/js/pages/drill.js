// ★ drill (JLPT 文法 ② 並べ替え): four shuffled pieces fill four blanks; pick the one
// for the ★ slot (★のみ), or put all four in order (全部並べる). Questions come from the
// grammar examples (by level), the Library, or the sample passages, and are built by
// engine/star.js. Ten per round; misses can be retried.

import { initPage } from '../core/hub.js';
import { t, tr, onPrefsChange } from '../core/prefs.js';
import { icon, hydrateIcons } from '../core/icons.js';
import { escapeHtml as esc } from '../core/util.js';
import { STORAGE_KEYS } from '../core/constants.js';
import { BUILD } from '../core/version.js';
import { isTyping } from '../core/ui.js';
import { analyze, onTokenizerState, preloadTokenizer } from '../engine/tokenizer.js';
import { PATTERNS, PATTERN_BY_ID, LEVELS } from '../engine/patterns.js';
import { splitSentences } from '../engine/tokens.js';
import { makeStarQuestion, isRightOrder } from '../engine/star.js';
import { DRILL_SENTENCES } from '../engine/grammar/drill.js';
import { levelBadge, logicBadge } from './render.js';

const { store } = await initPage('drill');

const $ = (id) => document.getElementById(id);
const ROUND = 10;

const SOURCES = [
  { id: 'grammar', ja: '文法の例文', en: 'Grammar examples' },
  { id: 'library', ja: '例文帳', en: 'Library' },
  { id: 'passages', ja: '例の文章', en: 'Sample passages' },
];
const MODES = [
  { id: 'star', ja: '★のみ', en: '★ only', hint: { ja: '★に入るものを選ぶ（試験と同じ）', en: 'Pick the piece for ★ (as in the exam)' } },
  { id: 'order', ja: '全部並べる', en: 'Order all', hint: { ja: '四つ全部を正しい順に並べる', en: 'Put all four pieces in order' } },
];

const settings = { source: 'grammar', levels: ['N5', 'N4'], mode: 'star' };
try {
  Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEYS.DRILL) || '{}'));
} catch (_) {}
const saveSettings = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.DRILL, JSON.stringify(settings));
  } catch (_) {}
};

// Round state
let round = null; // { questions: [q], i, results: [bool], picked: [ids] , answered }
let passages = [];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
function chips(set, items, key, multi) {
  return items
    .map((it) => {
      const on = multi ? set.includes(it.id) : set === it.id;
      return `<button type="button" class="chip${on ? ' active' : ''}" data-${key}="${it.id}" aria-pressed="${on}"${it.hint ? ` title="${esc(tr(it.hint))}"` : ''}>${it.text ?? esc(tr(it))}</button>`;
    })
    .join('');
}

function renderSetup() {
  $('dr-sources').innerHTML = chips(settings.source, SOURCES, 'source', false);
  $('dr-levels').innerHTML = chips(settings.levels, LEVELS.filter((l) => l !== 'extra').map((l) => ({ id: l, text: l })), 'level', true);
  $('dr-modes').innerHTML = chips(settings.mode, MODES, 'mode', false);
  $('dr-levels-row').hidden = settings.source !== 'grammar';
  const n = settings.source === 'library' ? store.sentences.length : null;
  $('dr-status').textContent = n === 0 ? t('例文帳が空です。文の分析で文を保存してください。', 'Your Library is empty. Save sentences from Breakdown first.') : '';
}

$('dr-setup').addEventListener('click', (e) => {
  const b = e.target.closest('[data-source],[data-level],[data-mode]');
  if (!b) return;
  if (b.dataset.source) settings.source = b.dataset.source;
  if (b.dataset.mode) settings.mode = b.dataset.mode;
  if (b.dataset.level) {
    const l = b.dataset.level;
    settings.levels = settings.levels.includes(l) ? settings.levels.filter((x) => x !== l) : [...settings.levels, l];
    if (!settings.levels.length) settings.levels = [l];
  }
  saveSettings();
  renderSetup();
});

onTokenizerState((s, detail) => {
  const el = $('dr-status');
  if (s === 'loading') el.innerHTML = `${icon('loading')}${esc(t('辞書を読み込み中…（初回のみ約18MB）', 'Loading the dictionary… (about 18 MB, first time only)'))}`;
  else if (s === 'error') el.innerHTML = `${icon('alert')}${esc(t('辞書を読み込めませんでした: ', 'Could not load the dictionary: ') + detail)}`;
  else if (el.querySelector('svg')) el.textContent = '';
});

async function loadPassages() {
  try {
    const res = await fetch(`data/passages.json?v=${BUILD}`);
    passages = res.ok ? await res.json() : [];
  } catch (_) {
    passages = [];
  }
}

// Candidate sentences for the current source: [{ text, focus?, level? }]
function candidates() {
  if (settings.source === 'grammar') return PATTERNS.filter((p) => settings.levels.includes(p.level) && DRILL_SENTENCES[p.id]).map((p) => ({ text: DRILL_SENTENCES[p.id], focus: p.id, level: p.level }));
  if (settings.source === 'library') return store.sentences.flatMap((s) => splitSentences(s.ja).map((x) => ({ text: x.text })));
  return passages.flatMap((p) => splitSentences(p.ja).map((x) => ({ text: x.text, level: p.level })));
}

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
};

async function startRound(pool) {
  $('dr-start').disabled = true;
  $('dr-status').innerHTML = `${icon('loading')}${esc(t('問題を作成中…', 'Making questions…'))}`;
  const questions = [];
  try {
    const seen = new Set();
    for (const c of pool) {
      if (questions.length >= ROUND) break;
      if (seen.has(c.text)) continue;
      seen.add(c.text);
      const [s] = await analyze(c.text);
      const q = s && makeStarQuestion(s, { seed: (Math.random() * 2 ** 32) >>> 0, focus: c.focus || null });
      if (q) questions.push({ ...q, level: c.level || null, focus: q.focus || c.focus || null });
    }
  } catch (err) {
    $('dr-status').textContent = t('問題を作れませんでした: ', 'Could not make questions: ') + err.message;
    $('dr-start').disabled = false;
    return;
  }
  $('dr-start').disabled = false;
  $('dr-status').textContent = '';
  if (!questions.length) {
    $('dr-status').textContent = t('この条件では問題を作れませんでした。', 'No questions could be made from this source.');
    return;
  }
  round = { questions, i: 0, results: [], picked: [], answered: false };
  $('dr-setup').hidden = true;
  $('dr-question').hidden = false;
  renderQuestion();
}

$('dr-start').addEventListener('click', () => startRound(shuffle(candidates())));
$('dr-start').addEventListener('pointerenter', preloadTokenizer, { once: true });

// ---------------------------------------------------------------------------
// A question
// ---------------------------------------------------------------------------
const pieceText = (q, id) => q.pieces.find((p) => p.id === id).text;

function slotsHtml(q, filled, reveal) {
  return q.order
    .map((_, n) => {
      const id = reveal ? q.order[n] : filled[n];
      const star = n === q.star;
      const cls = ['dr-slot'];
      if (star) cls.push('star');
      if (id) cls.push('filled');
      if (reveal && filled.length && filled[n] !== undefined) cls.push(pieceText(q, filled[n]) === pieceText(q, q.order[n]) ? 'right' : 'wrong');
      return `<button type="button" class="${cls.join(' ')}" data-slot="${n}" ${reveal || !id ? 'tabindex="-1"' : ''}>${star ? '<span class="dr-star">★</span>' : ''}${id ? `<span class="dr-slot-text" lang="ja">${esc(pieceText(q, id))}</span>` : ''}</button>`;
    })
    .join('');
}

function renderQuestion() {
  const box = $('dr-question');
  if (round.i >= round.questions.length) return renderSummary();
  const q = round.questions[round.i];
  const order = settings.mode === 'order';
  const done = round.answered;
  const used = new Set(round.picked);
  const right = round.results[round.i];
  const p = q.focus && PATTERN_BY_ID.get(q.focus);

  const pieces = q.pieces
    .map((pc, n) => {
      const cls = ['dr-piece'];
      if (done && pc.id === q.answer) cls.push('right');
      if (done && !right && round.picked.includes(pc.id) && !order) cls.push('wrong');
      if (order && used.has(pc.id)) cls.push('used');
      return `<button type="button" class="${cls.join(' ')}" data-piece="${pc.id}" ${done || (order && used.has(pc.id)) ? 'disabled' : ''}><span class="dr-num">${n + 1}</span><span lang="ja">${esc(pc.text)}</span></button>`;
    })
    .join('');

  const prompt = order ? t('四つを正しい順に並べてください。', 'Put the four pieces in order.') : t('★に入るものはどれですか。', 'Which piece goes in ★?');
  const verdict = done
    ? `<div class="dr-verdict ${right ? 'right' : 'wrong'}">${icon(right ? 'check' : 'close')}${esc(right ? t('正解！', 'Correct!') : t('不正解', 'Not quite'))}</div>`
    : '';
  const explain = done
    ? `<div class="dr-explain">
        <div class="dr-full" lang="ja">${esc(q.before)}${q.order.map((id, n) => `<span class="dr-full-piece${n === q.star ? ' star' : ''}">${esc(pieceText(q, id))}</span>`).join('')}${esc(q.after)}</div>
        ${p ? `<a class="pattern-chip" href="grammar.html#${esc(p.id)}">${levelBadge(p.level)}<span lang="ja">${esc(p.label)}</span>${logicBadge(p)}</a><p class="muted">${esc(t(p.ja, p.en))}</p>` : ''}
        <div class="dr-next-row">
          <a class="tb-btn" href="index.html?s=${encodeURIComponent(q.text)}">${icon('breakdown')}${esc(t('文の分析で開く', 'Open in Breakdown'))}</a>
          <button type="button" class="tb-btn primary" id="dr-next">${esc(round.i + 1 < round.questions.length ? t('次へ', 'Next') : t('結果を見る', 'See results'))}${icon('arrowRight')}</button>
        </div>
      </div>`
    : '';
  const canCheck = order && !done && round.picked.length === q.order.length;

  box.innerHTML = `
    <div class="dr-head">
      <span class="dr-progress">${round.i + 1} / ${round.questions.length}</span>
      ${q.level ? levelBadge(q.level) : ''}
      <span class="spacer"></span>
      <span class="dr-score">${esc(t(`正解 ${round.results.filter(Boolean).length}`, `${round.results.filter(Boolean).length} correct`))}</span>
      <button type="button" class="icon-btn small" id="dr-quit" aria-label="${esc(t('やめる', 'Quit'))}" title="${esc(t('やめる', 'Quit'))}">${icon('close')}</button>
    </div>
    <p class="dr-prompt">${esc(prompt)}</p>
    <div class="dr-sentence" lang="ja">${esc(q.before)}<span class="dr-slots">${slotsHtml(q, order ? round.picked : [], done)}</span>${esc(q.after)}</div>
    <div class="dr-pieces">${pieces}</div>
    ${canCheck ? `<button type="button" class="tb-btn primary" id="dr-check">${icon('check')}${esc(t('チェック', 'Check'))}</button>` : ''}
    ${verdict}${explain}`;
  if (done) $('dr-next')?.focus();
}

function answer(right) {
  round.results[round.i] = right;
  round.answered = true;
  renderQuestion();
}

$('dr-question').addEventListener('click', (e) => {
  if (!round) return;
  if (e.target.closest('#dr-quit')) return quit();
  if (e.target.closest('#dr-again')) return startRound(shuffle(candidates()));
  if (e.target.closest('#dr-retry')) return startRound(round.questions.filter((_, n) => !round.results[n]).map((q) => ({ text: q.text, focus: q.focus, level: q.level })));
  if (e.target.closest('#dr-setup-btn')) return quit();
  if (e.target.closest('#dr-next')) return next();
  if (round.i >= round.questions.length) return;
  const q = round.questions[round.i];
  if (e.target.closest('#dr-check')) return answer(isRightOrder(q, round.picked));
  if (round.answered) return;
  const piece = e.target.closest('[data-piece]');
  if (piece) return pick(Number(piece.dataset.piece));
  const slot = e.target.closest('.dr-slot.filled');
  if (slot && settings.mode === 'order') {
    round.picked = round.picked.slice(0, Number(slot.dataset.slot)); // take that piece (and any after it) back
    renderQuestion();
  }
});

function pick(id) {
  const q = round.questions[round.i];
  if (settings.mode === 'star') {
    round.picked = [id];
    return answer(pieceText(q, id) === pieceText(q, q.answer));
  }
  if (round.picked.includes(id) || round.picked.length >= q.order.length) return;
  round.picked.push(id);
  renderQuestion();
}

function next() {
  round.i++;
  round.picked = [];
  round.answered = false;
  renderQuestion();
}

function quit() {
  round = null;
  $('dr-question').hidden = true;
  $('dr-setup').hidden = false;
  renderSetup();
}

// Keys: 1–4 pick a piece, Enter goes on.
document.addEventListener('keydown', (e) => {
  if (!round || isTyping() || e.ctrlKey || e.metaKey || e.altKey) return;
  if (round.i >= round.questions.length) return;
  const q = round.questions[round.i];
  if (!round.answered && /^[1-4]$/.test(e.key)) {
    const pc = q.pieces[Number(e.key) - 1];
    if (pc) pick(pc.id);
  } else if (e.key === 'Enter') {
    if (round.answered) next();
    else if (settings.mode === 'order' && round.picked.length === q.order.length) answer(isRightOrder(q, round.picked));
  } else if (e.key === 'Backspace' && settings.mode === 'order' && !round.answered && round.picked.length) {
    round.picked.pop();
    renderQuestion();
  }
});

function renderSummary() {
  const n = round.questions.length;
  const ok = round.results.filter(Boolean).length;
  const missed = round.questions.filter((_, k) => !round.results[k]);
  $('dr-question').innerHTML = `
    <div class="dr-summary">
      <div class="dr-big">${ok} / ${n}</div>
      <p>${esc(ok === n ? t('全問正解です！', 'All correct!') : t(`${n - ok}問まちがえました。`, `${n - ok} to review.`))}</p>
      ${missed.length ? `<ul class="dr-missed">${missed.map((q) => `<li><a href="index.html?s=${encodeURIComponent(q.text)}" lang="ja">${esc(q.text)}</a>${q.focus ? ` <span class="muted" lang="ja">${esc(PATTERN_BY_ID.get(q.focus).label)}</span>` : ''}</li>`).join('')}</ul>` : ''}
      <div class="dr-next-row">
        ${missed.length ? `<button type="button" class="tb-btn primary" id="dr-retry">${esc(t('まちがえた問題をもう一度', 'Retry the missed ones'))}</button>` : ''}
        <button type="button" class="tb-btn${missed.length ? '' : ' primary'}" id="dr-again">${esc(t('新しい10問', 'Ten new questions'))}</button>
        <button type="button" class="tb-btn" id="dr-setup-btn">${esc(t('設定に戻る', 'Back to settings'))}</button>
      </div>
    </div>`;
}

onPrefsChange((what) => {
  if (what !== 'lang') return;
  renderSetup();
  if (round) renderQuestion();
});
store.onChange(() => !round && renderSetup());

renderSetup();
hydrateIcons(document.body);
loadPassages();
