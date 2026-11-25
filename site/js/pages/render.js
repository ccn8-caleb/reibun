// HTML for an analysed sentence: the chunked sentence line, the skeleton (main
// predicate and what hangs on it), the structure tree and pattern chips.
// Shared by the Breakdown and Grammar pages. Everything is escaped here.

import { escapeHtml as esc } from '../core/util.js';
import { t, tr } from '../core/prefs.js';
import { KINDS, rubyParts } from '../engine/tokens.js';
import { ROLES, CONNECTORS } from '../engine/roles.js';
import { summarize } from '../engine/conjugation.js';
import { PATTERN_BY_ID } from '../engine/patterns.js';

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

// Attachment tree: each chunk under the chunk it modifies.
export function treeHtml(s) {
  const children = new Map();
  const roots = [];
  for (const b of s.chunks) {
    if (b.tokens.every((x) => x.pos === '記号')) continue;
    if (b.dep < 0) roots.push(b);
    else {
      if (!children.has(b.dep)) children.set(b.dep, []);
      children.get(b.dep).push(b);
    }
  }
  const node = (b) => {
    const role = roleOf(b);
    const kids = children.get(b.id) || [];
    return `<li><span class="tree-node tone-${role.tone}" data-chunk="${b.id}"><span lang="ja">${esc(chunkText(b))}</span><span class="tree-role">${esc(tr(role))}</span></span>${
      kids.length ? `<ul>${kids.map(node).join('')}</ul>` : ''
    }</li>`;
  };
  return `<ul class="tree">${roots.map(node).join('')}</ul>`;
}

export function patternChipsHtml(s) {
  if (!s.patterns.length) return `<span class="insp-empty">${t('この文では文法パターンが見つかりませんでした。', 'No grammar patterns found in this sentence.')}</span>`;
  return `<div class="pattern-row">${patternIds(s)
    .map((id) => {
      const p = PATTERN_BY_ID.get(id);
      const n = s.patterns.filter((m) => m.id === id).length;
      return `<button type="button" class="pattern-chip" data-pattern="${id}"><span class="level-badge" data-level="${p.level}">${p.level}</span><span lang="ja">${esc(p.label)}</span>${n > 1 ? `<span class="pattern-en">×${n}</span>` : ''}</button>`;
    })
    .join('')}</div>`;
}

// Distinct pattern ids in order of first appearance.
export const patternIds = (s) => [...new Set(s.patterns.map((m) => m.id))];

// Mark every occurrence of pattern `id` (or clear with null) inside root.
export function highlightTokens(root, s, id) {
  root.querySelectorAll('.tok.hl').forEach((el) => el.classList.remove('hl'));
  if (!id) return;
  for (const m of s.patterns.filter((x) => x.id === id)) {
    for (let i = m.start; i < m.end; i++) root.querySelector(`.tok[data-tok="${i}"]`)?.classList.add('hl');
  }
}
