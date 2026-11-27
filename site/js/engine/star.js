// ★ drill (JLPT 文法 ② 並べ替え): a sentence with four blanks, one marked ★, and the
// four pieces that fill them, shuffled. Pure: input is one analysed sentence.
//
//   makeStarQuestion(sentence, { seed, focus })
//     → { before, after, pieces: [{ id, text }], order: [id…], star, answer, focus, text }
//       before / after: the visible text around the blanks (commas inside the blanks are dropped)
//       pieces: shuffled; order: piece ids in the right order; star: the ★ slot (0–3);
//       answer: the id that goes in the ★ slot; focus: the pattern id the blanks cover
//     → null when the sentence can't make a fair question: too short to leave context
//       on both sides of the blanks (as the exam always does), repeated pieces, or
//       pieces that could go in more than one order

import { PATTERN_BY_ID } from './patterns.js';

const SLOTS = 4;
const isSymbol = (t) => t.pos === '記号';

// Small seeded PRNG (mulberry32), so a sentence + seed always gives the same question.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A stable number for a string (seeds per sentence).
export function hash(s) {
  let h = 2166136261;
  for (const c of String(s)) h = Math.imul(h ^ c.codePointAt(0), 16777619);
  return h >>> 0;
}

// Can a piece boundary fall before token c? Not inside an inflection (降っ|て, 飲まなけれ|ば,
// した|た), before a suffix, or after a prefix (お|帰り).
function canCut(tok, c) {
  const next = tok[c];
  const prev = tok[c - 1];
  if (!next || !prev) return false;
  if (next.pos === '助動詞' || next.pos1 === '接尾' || (next.pos === '助詞' && next.pos1 === '接続助詞')) return false;
  if (prev.pos === '接頭詞') return false;
  // No piece starts with a small っ (IPADIC splits 分かりっこない as 分かり|っ|こ|ない).
  if (next.surface.startsWith('っ') && next.pos !== '助詞') return false;
  // のに / のは / んだ: the nominalizer stays with what follows.
  if (prev.pos1 === '非自立' && ['の', 'ん'].includes(prev.surface) && ['助詞', '助動詞'].includes(next.pos)) return false;
  return true;
}

// Units: the sentence's phrases (bunsetsu) as token ranges, punctuation kept with the
// phrase it follows. fine: also split each phrase before its trailing particles
// (英語だけ → 英語 + だけ). Too few units: split the longest at the allowed cut nearest
// its middle.
function units(sentence, fine) {
  const tok = sentence.tokens;
  // A piece that is a bare one-character particle (が, を…) reads oddly: never make one.
  const lone = (x, y) => {
    const words = tok.slice(x, y).filter((t) => !isSymbol(t));
    return words.length === 1 && words[0].pos === '助詞' && words[0].surface.length === 1;
  };
  const out = [];
  for (const b of sentence.chunks) {
    const start = b.tokens[0].i;
    const end = b.tokens[b.tokens.length - 1].i + 1;
    let cut = end;
    if (fine) {
      let k = b.tokens.length;
      while (k > 0 && isSymbol(b.tokens[k - 1])) k--;
      let p = k;
      while (p > 0 && b.tokens[p - 1].pos === '助詞') p--;
      // …unless that leaves a one-character particle alone (が, を): だけ, から, まで are fine.
      if (p > 0 && p < k && canCut(tok, b.tokens[p].i) && !lone(b.tokens[p].i, b.tokens[k - 1].i + 1)) cut = b.tokens[p].i;
    }
    if (cut < end) out.push({ start, end: cut }, { start: cut, end });
    else out.push({ start, end });
  }
  // A phrase that is nothing but a particle (the splitter sometimes leaves は alone)
  // joins the phrase before it.
  for (let k = out.length - 1; k > 0; k--) {
    const words = tok.slice(out[k].start, out[k].end).filter((t) => !isSymbol(t));
    if (words.length && words.every((t) => t.pos === '助詞') && words.map((t) => t.surface).join('').length === 1) {
      out[k - 1] = { start: out[k - 1].start, end: out[k].end };
      out.splice(k, 1);
    }
  }
  const cuts = (u) => {
    const c = [];
    for (let i = u.start + 1; i < u.end; i++) {
      if (!canCut(tok, i) || isSymbol(tok[i]) || lone(u.start, i) || lone(i, u.end)) continue;
      c.push(i);
    }
    return c;
  };
  // Aim for four pieces plus a phrase of context on each side.
  const NEED = SLOTS + 2;
  while (out.length < NEED) {
    let k = -1;
    for (let j = 0; j < out.length; j++) if (cuts(out[j]).length && (k < 0 || out[j].end - out[j].start > out[k].end - out[k].start)) k = j;
    if (k < 0) break;
    const u = out[k];
    const mid = (u.start + u.end) / 2;
    const cut = cuts(u).sort((x, y) => Math.abs(x - mid) - Math.abs(y - mid))[0];
    out.splice(k, 1, { start: u.start, end: cut }, { start: cut, end: u.end });
  }
  return out;
}

const END = /^[。！？!?」』]$/;

// Phrases that can move around in a Japanese sentence (case-marked arguments, topics,
// time words, adverbs). Word order is free enough that pieces like these can often go
// in more than one order: they swap (AがBを読む = BをAが読む), or one jumps over a whole
// phrase (何もしないで家で… = 家で何もしないで…). What stays fixed: a movable phrase
// still comes before the phrase it attaches to, and everything else keeps its order.
const FLOATING = new Set(['topic', 'subject', 'object', 'target', 'agent', 'causee', 'time', 'direction', 'means', 'companion', 'source', 'limit', 'comparison', 'also', 'listing', 'limiter', 'adverbial', 'noun']);
const NEEDS_NEXT = new Set(['modifier', 'possessive']); // must sit right before its noun

// For each piece: { move: can it move?, head: index of the piece it attaches to (or
// SLOTS when that lies after the blanks), glue: must it stay right before the next piece? }
function structure(sentence, win) {
  const pieceOf = (tokenIndex) => win.findIndex((u) => tokenIndex >= u.start && tokenIndex < u.end);
  return win.map((u) => {
    const c = sentence.chunks.find((b) => b.tokens[0].i === u.start && b.tokens[b.tokens.length - 1].i + 1 >= u.end);
    const whole = c && c.tokens.filter((t) => !isSymbol(t)).at(-1).i < u.end;
    if (!whole) return { move: false, head: -1, glue: false };
    let head = c.dep >= 0 ? pieceOf(sentence.chunks[c.dep].tokens[0].i) : SLOTS;
    if (head < 0) head = c.dep >= 0 && sentence.chunks[c.dep].tokens[0].i >= win[SLOTS - 1].end ? SLOTS : -1;
    return { move: FLOATING.has(c.role), head, glue: NEEDS_NEXT.has(c.role) };
  });
}

// Slots whose piece is the same in every valid order: every movable piece lies to the
// left and attaches at or before the slot, so nothing can move past it.
function fixedSlots(st) {
  const out = [];
  for (let s = 0; s < SLOTS; s++) if (st.every((p, n) => !p.move || (n < s && p.head >= 0 && p.head <= s))) out.push(s);
  return out;
}

const textOf = (sentence, a, b) => sentence.tokens.slice(a, b).map((t) => t.surface).join('');

export function makeStarQuestion(sentence, { seed = hash(sentence.text), focus = null } = {}) {
  // Whole phrases make the most natural pieces; fall back to finer ones.
  return build(sentence, seed, focus, false) || build(sentence, seed, focus, true);
}

function build(sentence, seed, focus, fine) {
  const us = units(sentence, fine);
  if (us.length < SLOTS + 2) return null;
  const random = rng(seed);
  const tok = sentence.tokens;
  // Pattern matches worth centring on: the requested one, else any visible one.
  const matches = sentence.patterns.filter((m) => (focus ? m.id === focus : !PATTERN_BY_ID.get(m.id).quiet));

  let best = null;
  // Blanks never start the sentence or end it: there is always context on both sides.
  for (let w = 1; w + SLOTS < us.length; w++) {
    const win = us.slice(w, w + SLOTS);
    const a = win[0].start;
    // Trailing punctuation of the last piece stays visible after the blanks.
    let bEnd = win[SLOTS - 1].end;
    while (bEnd > a && isSymbol(tok[bEnd - 1])) bEnd--;
    // Commas inside the blanks are dropped (the exam's pieces never carry them).
    const pieces = win.map((u, n) => textOf(sentence, u.start, n === SLOTS - 1 ? bEnd : u.end).replace(/[、，,]+$/, ''));
    // Unfair: an empty piece, a sentence end inside the blanks, or two identical pieces.
    if (pieces.some((p) => !p || /[、，,]/.test(p))) continue;
    if (tok.slice(a, bEnd).some((t) => END.test(t.surface))) continue;
    if (new Set(pieces).size < SLOTS) continue;
    // The ★ must go where every valid order puts the same piece.
    const st = structure(sentence, win);
    const safe = fixedSlots(st);
    if (!safe.length) continue;
    const covered = matches.filter((m) => m.start >= a && m.end <= bEnd);
    if (focus && !covered.length) continue;
    let score = covered.length ? 4 : 0;
    score += Math.min(w, 2) * 0.25 + Math.min(us.length - w - SLOTS, 2) * 0.25; // more context is better
    score -= tok.slice(a, bEnd).filter((t) => /^[、，,]$/.test(t.surface)).length * 0.5; // prefer no dropped commas
    score -= win.filter((u) => u.end - u.start === 1 && tok[u.start].pos === '助詞').length * 0.75; // and few lone particles
    if (safe.some((x) => x === 1 || x === 2)) score += 0.5; // the exam stars the 2nd or 3rd slot
    score += random() * 0.5; // vary among equals
    if (!best || score > best.score) best = { score, a, b: bEnd, pieces, st, safe, focus: covered[0]?.id || null };
  }
  if (!best) return null;

  const ids = best.pieces.map((_, n) => n + 1);
  let shuffled = [...ids];
  for (let tries = 0; tries < 10 && shuffled.every((id, n) => id === ids[n]); tries++) {
    for (let n = shuffled.length - 1; n > 0; n--) {
      const k = Math.floor(random() * (n + 1));
      [shuffled[n], shuffled[k]] = [shuffled[k], shuffled[n]];
    }
  }
  const middle = best.safe.filter((x) => x === 1 || x === 2);
  const choices = middle.length ? middle : best.safe;
  const star = choices[Math.floor(random() * choices.length)];
  return {
    text: sentence.text,
    before: textOf(sentence, 0, best.a),
    after: textOf(sentence, best.b, tok.length),
    pieces: shuffled.map((id) => ({ id, text: best.pieces[id - 1] })),
    order: ids,
    star,
    answer: ids[star],
    focus: best.focus,
    // How the pieces may move (for accepting other right orders): per piece id.
    rules: Object.fromEntries(ids.map((id, n) => [id, best.st[n]])),
  };
}

// Is a full ordering (piece ids, slot by slot) right? The original order is, and so is
// any order that keeps the fixed pieces in sequence, puts each movable piece before
// the piece it attaches to, and slips nothing between a modifier and its noun.
export function isRightOrder(q, ids) {
  if (ids.length !== q.order.length || new Set(ids).size !== ids.length) return false;
  if (ids.every((id, n) => id === q.order[n])) return true;
  if (!q.rules) return false;
  const pos = new Map(ids.map((id, n) => [id, n]));
  const fixed = q.order.filter((id) => !q.rules[id].move);
  if (!fixed.every((id, n) => n === 0 || pos.get(id) > pos.get(fixed[n - 1]))) return false;
  for (const id of q.order) {
    const r = q.rules[id];
    const head = r.head >= 0 && r.head < q.order.length ? q.order[r.head] : null;
    if (r.move && head !== null && pos.get(id) > pos.get(head)) return false;
    if (r.glue && head !== null && pos.get(head) !== pos.get(id) + 1) return false;
  }
  return true;
}
