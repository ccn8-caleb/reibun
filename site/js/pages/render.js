// HTML for an analysed sentence: the chunked sentence line, the skeleton (main
// predicate and what hangs on it), connection threads, pattern chips, and the
// paragraph logic chart.
// Shared by the Breakdown and Grammar pages. Everything is escaped here.

import { escapeHtml as esc } from '../core/util.js';
import { t, tr } from '../core/prefs.js';
import { KINDS, rubyParts } from '../engine/tokens.js';
import { ROLES, CONNECTORS } from '../engine/roles.js';
import { summarize } from '../engine/conjugation.js';
import { PATTERN_BY_ID, LOGIC_BY_ID, LEVEL_NAMES, visiblePatterns } from '../engine/patterns.js';
import { threadEdges, arcDepths } from '../engine/threads.js';

export const posGroup = (tok) => KINDS[tok.kind]?.group || 'other';
export const roleOf = (b) => ROLES[b.role] || ROLES.noun;
const chunkText = (b) => b.tokens.filter((x) => x.pos !== '記号').map((x) => x.surface).join('') || b.text;

export function rubyHtml(surface, reading) {
  return rubyParts(surface, reading)
    .map((p) => (p.rt ? `<ruby>${esc(p.text)}<rt>${esc(p.rt)}</rt></ruby>` : esc(p.text)))
    .join('');
}

export function tokenHtml(tok) {
  return `<span class="tok pos-${posGroup(tok)}" data-tok="${tok.i}">${rubyHtml(tok.surface, tok.reading)}</span>`;
}

export function sentenceLineHtml(s) {
  return `<div class="sentence-line" lang="ja">${s.chunks
    .map((b) => {
      const role = roleOf(b);
      const conn = CONNECTORS[b.roleInfo.connector];
      const tipJa = role.ja + (conn ? ` · ${conn.ja}` : '');
      const tipEn = role.en + (conn ? ` · ${conn.en}` : '');
      return `<span class="chunk tone-${role.tone}" data-chunk="${b.id}" data-tip-ja="${esc(tipJa)}" data-tip-en="${esc(tipEn)}">
        <span class="chunk-role">${esc(tr(role))}</span>
        <span class="chunk-words">${b.tokens.map(tokenHtml).join('')}</span>
      </span>`;
    })
    .join('')}</div>`;
}

// Main predicate and its direct arguments, in sentence order.
export function skeletonHtml(s) {
  if (!s.skeleton) return '';
  const { root, args } = s.skeleton;
  const items = [...args, root].sort((a, b) => a - b).map((id) => {
    const b = s.chunks[id];
    const role = roleOf(b);
    const note = id === root && b.conj ? summarize(b.conj, t) : '';
    return `<span class="skel-item tone-${role.tone}" data-chunk="${id}">
      <span class="skel-role">${esc(tr(role))}</span><span class="skel-text" lang="ja">${esc(chunkText(b))}</span>${note ? `<span class="skel-note">${esc(note)}</span>` : ''}</span>`;
  });
  return `<div class="skeleton">${items.join('')}</div>`;
}

// Connection threads: phrases top to bottom, each with a line in the left gutter to
// the phrase it attaches to. drawThreads() draws the lines once the rows are laid out.
export function threadsHtml(s) {
  const { rows, edges } = threadEdges(s.chunks);
  const depth = arcDepths(edges);
  const lanes = Math.max(0, ...depth);
  const data = edges.map((e, i) => [e.from, e.to, depth[i], roleOf(rows[e.from]).tone]);
  return `<div class="threads" style="--lanes: ${lanes}" data-edges='${JSON.stringify(data)}'>
    <svg class="threads-svg" aria-hidden="true"></svg>
    <ol class="thread-rows">${rows
      .map((b, i) => {
        const role = roleOf(b);
        return `<li class="thread-row tone-${role.tone}" data-row="${i}" data-chunk="${b.id}"><span class="thread-text" lang="ja">${esc(chunkText(b))}</span><span class="thread-role">${esc(tr(role))}</span></li>`;
      })
      .join('')}</ol></div>`;
}

const LANE = 12; // px between lanes

export function drawThreads(root) {
  root.querySelectorAll('.threads').forEach((box) => {
    const svg = box.querySelector('.threads-svg');
    const rows = [...box.querySelectorAll('.thread-row')];
    const edges = JSON.parse(box.dataset.edges || '[]');
    if (!rows.length || !box.offsetParent) return; // hidden (closed <details>)
    const lanes = Number(getComputedStyle(box).getPropertyValue('--lanes')) || 0;
    const gutter = (lanes + 1) * LANE;
    const mid = (r) => r.offsetTop + r.offsetHeight / 2;
    svg.setAttribute('width', gutter);
    svg.setAttribute('height', box.offsetHeight);
    svg.innerHTML = edges
      .map(([from, to, d, tone], i) => {
        const x = gutter - d * LANE;
        const y1 = mid(rows[from]);
        const y2 = mid(rows[to]);
        const r = Math.min(6, Math.abs(y2 - y1) / 2, gutter - x);
        const dir = y2 > y1 ? 1 : -1;
        return `<path class="thread tone-${tone}" data-from="${from}" data-to="${to}" d="M ${gutter} ${y1} H ${x + r} Q ${x} ${y1} ${x} ${y1 + dir * r} V ${y2 - dir * r} Q ${x} ${y2} ${x + r} ${y2} H ${gutter - 2}" />
          <path class="thread-head tone-${tone}" data-from="${from}" data-to="${to}" d="M ${gutter - 6} ${y2 - 4} L ${gutter - 1} ${y2} L ${gutter - 6} ${y2 + 4}" />`;
      })
      .join('');
  });
}

// Light up one phrase's threads: the chain up to the predicate, and what hangs on it.
export function focusThreads(root, chunkId) {
  root.querySelectorAll('.threads').forEach((box) => {
    const rows = [...box.querySelectorAll('.thread-row')];
    const edges = JSON.parse(box.dataset.edges || '[]');
    const row = rows.findIndex((r) => Number(r.dataset.chunk) === chunkId);
    box.classList.toggle('focused', row >= 0);
    const on = new Set();
    const lit = new Set();
    if (row >= 0) {
      on.add(row);
      for (let cur = row, guard = 0; guard < rows.length; guard++) {
        const e = edges.find(([f]) => f === cur);
        if (!e) break;
        lit.add(`${e[0]}:${e[1]}`);
        on.add(e[1]);
        cur = e[1];
      }
      for (const [f, t] of edges) if (t === row) (lit.add(`${f}:${t}`), on.add(f));
    }
    rows.forEach((r, i) => r.classList.toggle('lit', on.has(i)));
    box.querySelectorAll('.threads-svg path').forEach((p) => p.classList.toggle('lit', lit.has(`${p.dataset.from}:${p.dataset.to}`)));
  });
}

// The paragraph's line of reasoning (engine/discourse.js paragraphChart).
export function logicChartHtml(chart) {
  const name = (l) => (l ? tr(LOGIC_BY_ID.get(l.logic)) : '');
  const strip = chart
    .map((n, i) => {
      const label = n.opener ? name(n.opener) : i === 0 ? t('起点', 'Start') : t('続き', 'Then');
      const step = `<span class="lc-step${n.opener ? '' : ' plain'}" data-logic="${n.opener?.logic || ''}">${esc(label)}</span>`;
      const brk = i > 0 && n.para !== chart[i - 1].para ? '<span class="lc-para" aria-hidden="true">¶</span>' : '';
      return (i ? `${brk}<span class="lc-arrow" aria-hidden="true">→</span>` : '') + step;
    })
    .join('');
  const nodes = chart
    .map((n, i) => {
      const brk = i > 0 && n.para !== chart[i - 1].para ? `<li class="lc-break">${esc(t('段落', 'New paragraph'))}</li>` : '';
      const edge = i === 0 ? '' : n.opener
        ? `<div class="lc-edge" data-logic="${n.opener.logic}"><span class="lc-link" lang="ja">${esc(n.opener.text)}</span><span class="lc-fn">${esc(name(n.opener))}</span><span class="lc-hint">${esc(tr(LOGIC_BY_ID.get(n.opener.logic).hint))}</span></div>`
        : `<div class="lc-edge plain"><span class="lc-hint">${esc(t('つなぎの言葉なし', 'No linking word'))}</span></div>`;
      const inner = n.inner.length
        ? `<div class="lc-inner">${n.inner.map((l) => `<span class="lc-chip" data-logic="${l.logic}"><span lang="ja">${esc(l.text)}</span>${esc(name(l))}</span>`).join('')}</div>`
        : '';
      return `${brk}<li class="lc-node">${edge}<button type="button" class="lc-box" data-goto-s="${n.s}"><span class="lc-num">${n.s + 1}</span><span class="lc-text" lang="ja">${esc(n.text)}</span></button>${inner}</li>`;
    })
    .join('');
  return `<div class="lc-strip">${strip}</div><ol class="lc-list">${nodes}</ol>`;
}

// A pattern's level badge (N5 … N1, or JLPT外 for connectives).
export const levelBadge = (level) =>
  `<span class="level-badge" data-level="${level}">${esc(LEVEL_NAMES[level] ? tr(LEVEL_NAMES[level]) : level)}</span>`;

// A pattern's logic function (cause, contrast…), if it has one.
export function logicBadge(p) {
  const l = p.logic && LOGIC_BY_ID.get(p.logic);
  return l ? `<span class="logic-badge" data-logic="${l.id}" title="${esc(tr(l.hint))}">${esc(tr(l))}</span>` : '';
}

export function patternChipsHtml(s) {
  if (!patternIds(s).length) return `<span class="insp-empty">${t('この文では文法パターンが見つかりませんでした。', 'No grammar patterns found in this sentence.')}</span>`;
  return `<div class="pattern-row">${patternIds(s)
    .map((id) => {
      const p = PATTERN_BY_ID.get(id);
      const n = s.patterns.filter((m) => m.id === id).length;
      return `<button type="button" class="pattern-chip" data-pattern="${id}">${levelBadge(p.level)}<span lang="ja">${esc(p.label)}</span>${logicBadge(p)}${n > 1 ? `<span class="pattern-en">×${n}</span>` : ''}</button>`;
    })
    .join('')}</div>`;
}

// Distinct pattern ids in order of first appearance (quiet basics left out).
export const patternIds = (s) => [...new Set(visiblePatterns(s.patterns).map((m) => m.id))];

// Mark every occurrence of pattern `id` (or clear with null) inside root.
export function highlightTokens(root, s, id) {
  root.querySelectorAll('.tok.hl').forEach((el) => el.classList.remove('hl'));
  if (!id) return;
  for (const m of s.patterns.filter((x) => x.id === id)) {
    for (let i = m.start; i < m.end; i++) root.querySelector(`.tok[data-tok="${i}"]`)?.classList.add('hl');
  }
}
