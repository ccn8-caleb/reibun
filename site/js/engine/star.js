// ★ drill (JLPT 文法 ② 並べ替え): a sentence with four blanks, one marked ★, and the
// four pieces that fill them, shuffled. Pure: input is one analysed sentence.
//
//   makeStarQuestion(sentence, { seed, focus })
//     → { before, after, pieces: [{ id, text }], order: [id…], star, answer, focus, text }
//       before / after: the visible text around the blanks (commas inside the blanks are dropped)
//       pieces: shuffled; order: piece ids in the right order; star: the ★ slot (0–3);
//       answer: the id that goes in the ★ slot; focus: the pattern id the blanks cover
//     → null when the sentence can't make a fair question: too short to leave context
//       on both sides of the blanks (as the exam always does), or repeated pieces

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
      if (p > 0 && p < k && canCut(tok, b.tokens[p].i)) cut = b.tokens[p].i;
    }
    if (cut < end) out.push({ start, end: cut }, { start: cut, end });
    else out.push({ start, end });
  }
  // A piece that is one bare particle (が, を…) reads oddly; avoid making them.
  const lone = (x, y) => y - x === 1 && tok[x].pos === '助詞';
  const cuts = (u, allowLone) => {
    const c = [];
    for (let i = u.start + 1; i < u.end; i++) {
      if (!canCut(tok, i) || isSymbol(tok[i])) continue;
      if (!allowLone && (lone(u.start, i) || lone(i, u.end))) continue;
      c.push(i);
    }
    return c;
  };
  // Aim for four pieces plus a phrase of context on each side; split a particle off its
  // noun only if that's the only way to get there.
  const NEED = SLOTS + 2;
  for (const allowLone of [false, true]) {
    while (out.length < NEED) {
      let k = -1;
      for (let j = 0; j < out.length; j++) if (cuts(out[j], allowLone).length && (k < 0 || out[j].end - out[j].start > out[k].end - out[k].start)) k = j;
      if (k < 0) break;
      const u = out[k];
      const mid = (u.start + u.end) / 2;
      const cut = cuts(u, allowLone).sort((x, y) => Math.abs(x - mid) - Math.abs(y - mid))[0];
      out.splice(k, 1, { start: u.start, end: cut }, { start: cut, end: u.end });
    }
  }
  return out;
}

const END = /^[。！？!?」』]$/;

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
    const covered = matches.filter((m) => m.start >= a && m.end <= bEnd);
    if (focus && !covered.length) continue;
    let score = covered.length ? 4 : 0;
    score += Math.min(w, 2) * 0.25 + Math.min(us.length - w - SLOTS, 2) * 0.25; // more context is better
    score -= tok.slice(a, bEnd).filter((t) => /^[、，,]$/.test(t.surface)).length * 0.5; // prefer no dropped commas
    score -= win.filter((u) => u.end - u.start === 1 && tok[u.start].pos === '助詞').length * 0.75; // and few lone particles
    score += random() * 0.5; // vary among equals
    if (!best || score > best.score) best = { score, a, b: bEnd, pieces, focus: covered[0]?.id || null };
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
  const star = 1 + Math.floor(random() * 2); // JLPT usually stars the 2nd or 3rd slot
  return {
    text: sentence.text,
    before: textOf(sentence, 0, best.a),
    after: textOf(sentence, best.b, tok.length),
    pieces: shuffled.map((id) => ({ id, text: best.pieces[id - 1] })),
    order: ids,
    star,
    answer: ids[star],
    focus: best.focus,
  };
}

// Is a full ordering (piece ids, slot by slot) right?
export const isRightOrder = (q, ids) => ids.length === q.order.length && ids.every((id, n) => q.pieces.find((p) => p.id === id)?.text === q.pieces.find((p) => p.id === q.order[n]).text);
