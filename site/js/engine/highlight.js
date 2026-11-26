// Highlighter: the reader marks spans of a passage with pens (topic / subject,
// predicate, connector, key point) and Reibun grades the marks against its own
// analysis. Pure: input is the sentence list from analyzeText() and marks as
// character offsets into the whole text, [start, end).
//
//   answerKey(sentences)          what Reibun would mark
//   snapToTokens(sentences, a, b)  widen a selection to whole words
//   checkMarks(sentences, marks)   { results: [{ mark, verdict, message, item }], missed, counts }
//
// verdict: 'good' ✅ | 'close' 🟡 (right idea, boundaries off or a lesser item) |
//          'miss' ❌ | 'note' (key points: not graded)

import { ROLES } from './roles.js';
import { PATTERN_BY_ID, LOGIC_BY_ID } from './patterns.js';

export const PENS = [
  { id: 'subject', ja: '主語・主題', en: 'Topic / subject', hint: { ja: '「は」「が」の付いた、文が何について述べているかの部分', en: 'Who or what the sentence is about (with は / が)' } },
  { id: 'predicate', ja: '述語', en: 'Predicate', hint: { ja: '文の中心となる動詞・形容詞・名詞＋だ', en: 'The main verb, adjective or noun + だ' } },
  { id: 'connector', ja: 'つなぎ', en: 'Connector', hint: { ja: '理由・逆接・結論など、論理をつなぐ表現', en: 'Words that link ideas: because, but, so, for example…' } },
  { id: 'key', ja: '要点', en: 'Key point', hint: { ja: '大事だと思う部分（採点しない）', en: 'Anything you think matters (not graded)' } },
];
export const PEN_BY_ID = new Map(PENS.map((p) => [p.id, p]));

const isSymbol = (t) => t.pos === '記号';
const overlaps = (a, b) => a.start < b.end && b.start < a.end;
const overlapLen = (a, b) => Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));

// A span of tokens (global offsets), trimming punctuation at either end.
function tokenSpan(s, toks) {
  let a = 0;
  let b = toks.length;
  while (a < b && isSymbol(toks[a])) a++;
  while (b > a && isSymbol(toks[b - 1])) b--;
  if (a === b) return null;
  const start = s.offset + toks[a].start;
  const end = s.offset + toks[b - 1].end;
  return { start, end, text: toks.slice(a, b).map((t) => t.surface).join('') };
}

// The chunk without its trailing particles (the noun of 私は), for boundary feedback.
function contentSpan(s, b) {
  const toks = b.tokens.filter((t) => !isSymbol(t));
  let n = toks.length;
  while (n > 1 && toks[n - 1].pos === '助詞') n--;
  return tokenSpan(s, toks.slice(0, n));
}

export function answerKey(sentences) {
  const items = [];
  sentences.forEach((s, k) => {
    const root = s.skeleton?.root;
    for (const b of s.chunks) {
      const span = tokenSpan(s, b.tokens);
      if (!span) continue;
      const base = { s: k, chunk: b.id, role: b.role, ...span, content: contentSpan(s, b) };
      if (b.role === 'topic' || b.role === 'subject') items.push({ type: 'subject', ...base });
      if (b.id === root) items.push({ type: 'predicate', main: true, ...base });
      else if (b.role === 'clause' || b.role === 'predicate') items.push({ type: 'predicate', main: false, ...base });
    }
    const seen = new Set();
    for (const m of s.patterns) {
      const p = PATTERN_BY_ID.get(m.id);
      if (!p.logic) continue;
      const span = tokenSpan(s, s.tokens.slice(m.start, m.end));
      if (!span || seen.has(`${span.start}:${span.end}`)) continue;
      seen.add(`${span.start}:${span.end}`);
      items.push({ type: 'connector', s: k, logic: p.logic, pattern: p.id, ...span, content: span });
    }
  });
  return items.sort((a, b) => a.start - b.start || b.end - a.end);
}

// Widen [start, end) to whole tokens; drop punctuation at the edges. null if empty.
export function snapToTokens(sentences, start, end) {
  const toks = [];
  for (const s of sentences) {
    for (const t of s.tokens) {
      const span = { start: s.offset + t.start, end: s.offset + t.end };
      if (overlaps(span, { start, end }) && !isSymbol(t)) toks.push(span);
    }
  }
  if (!toks.length) return null;
  return { start: toks[0].start, end: toks[toks.length - 1].end };
}

const q = (x) => `「${x}」`;
const roleName = (role) => ROLES[role] || ROLES.noun;

// The chunk under a mark (most overlap), to say what it is instead.
function chunkAt(sentences, mark) {
  let best = null;
  sentences.forEach((s) => {
    for (const b of s.chunks) {
      const span = tokenSpan(s, b.tokens);
      if (!span) continue;
      const n = overlapLen(span, mark);
      if (n > 0 && (!best || n > best.n)) best = { n, b, span };
    }
  });
  return best;
}

const msg = (ja, en) => ({ ja, en });

// How well a mark fits an item: exact, missing the particle, too wide, too narrow.
function fit(mark, item) {
  const inside = mark.start >= item.start && mark.end <= item.end;
  const coversContent = mark.start <= item.content.start && mark.end >= item.content.end;
  if (inside && coversContent) return mark.end < item.end ? 'no-particle' : 'exact';
  if (coversContent) return 'wide';
  return 'narrow';
}

function gradeSubject(sentences, mark, key) {
  const hits = key.filter((it) => it.type === 'subject' && overlaps(it, mark));
  if (!hits.length) {
    const at = chunkAt(sentences, mark);
    if (!at) return { verdict: 'miss', message: msg('ここには主語・主題がありません。', 'There is no topic or subject here.') };
    const r = roleName(at.b.role);
    return { verdict: 'miss', message: msg(`${q(at.span.text)}は${r.ja}です。主語・主題は「は」「が」の付いた部分です。`, `${q(at.span.text)} is the ${r.en.toLowerCase()}. A topic or subject usually ends in は or が.`) };
  }
  const item = hits.sort((a, b) => overlapLen(b, mark) - overlapLen(a, mark))[0];
  const r = roleName(item.role);
  const f = fit(mark, item);
  if (hits.length > 1) return { verdict: 'close', item, message: msg(`印が主語・主題を${hits.length}つまたいでいます。${hits.map((h) => q(h.text)).join('、')}を別々に。`, `Your mark spans ${hits.length} topics/subjects. Mark ${hits.map((h) => q(h.text)).join(', ')} separately.`) };
  if (f === 'exact') return { verdict: 'good', item, message: msg(`${q(item.text)}は${r.ja}です。`, `${q(item.text)} is the ${r.en.toLowerCase()}.`) };
  if (f === 'no-particle') return { verdict: 'good', item, message: msg(`${q(item.text)}は${r.ja}です（助詞まで含めるとより正確）。`, `${q(item.text)} is the ${r.en.toLowerCase()} (include the particle to be exact).`) };
  if (f === 'wide') return { verdict: 'close', item, message: msg(`${r.ja}は${q(item.text)}だけです。印が広すぎます。`, `The ${r.en.toLowerCase()} is just ${q(item.text)}; your mark takes in more.`) };
  return { verdict: 'close', item, message: msg(`${r.ja}は${q(item.text)}全体です。`, `The ${r.en.toLowerCase()} is the whole of ${q(item.text)}.`) };
}

function gradePredicate(sentences, mark, key) {
  const hits = key.filter((it) => it.type === 'predicate' && overlaps(it, mark));
  const main = hits.find((h) => h.main);
  if (main) {
    const f = fit(mark, main);
    if (f === 'exact' || f === 'no-particle') return { verdict: 'good', item: main, message: msg(`${q(main.text)}がこの文の述語です。`, `${q(main.text)} is this sentence's predicate.`) };
    if (f === 'wide') return { verdict: 'close', item: main, message: msg(`述語は${q(main.text)}です。印が広すぎます。`, `The predicate is ${q(main.text)}; your mark takes in more.`) };
    return { verdict: 'close', item: main, message: msg(`述語は${q(main.text)}全体です（活用語尾まで）。`, `The predicate is all of ${q(main.text)}, endings included.`) };
  }
  if (hits.length) {
    const sub = hits[0];
    const root = key.find((it) => it.type === 'predicate' && it.main && it.s === sub.s);
    return {
      verdict: 'close',
      item: sub,
      message: msg(
        `${q(sub.text)}は従属節の述語です。文全体の述語は${root ? q(root.text) : '文末'}です。`,
        `${q(sub.text)} is the predicate of a linked clause. The main predicate is ${root ? q(root.text) : 'at the end'}.`
      ),
    };
  }
  const at = chunkAt(sentences, mark);
  if (!at) return { verdict: 'miss', message: msg('ここには述語がありません。', 'There is no predicate here.') };
  const r = roleName(at.b.role);
  return { verdict: 'miss', message: msg(`${q(at.span.text)}は${r.ja}です。述語は動詞・形容詞・名詞＋だの部分です。`, `${q(at.span.text)} is the ${r.en.toLowerCase()}. The predicate is the verb, adjective or noun + だ.`) };
}

function gradeConnector(sentences, mark, key) {
  const hits = key.filter((it) => it.type === 'connector' && overlaps(it, mark)).sort((a, b) => overlapLen(b, mark) - overlapLen(a, mark));
  if (!hits.length) return { verdict: 'miss', message: msg('ここには論理をつなぐ表現が見つかりません。', "Reibun doesn't see a linking expression here.") };
  const item = hits[0];
  const l = LOGIC_BY_ID.get(item.logic);
  const what = msg(`${q(item.text)}は「${l.ja}」：${l.hint.ja}。`, `${q(item.text)} is ${l.en.toLowerCase()}: ${l.hint.en.toLowerCase()}.`);
  const f = fit(mark, item);
  if (f === 'exact' || overlapLen(item, mark) >= 0.6 * (item.end - item.start)) return { verdict: 'good', item, message: what };
  return { verdict: 'close', item, message: msg(`表現全体は${q(item.text)}です。${what.ja}`, `The whole expression is ${q(item.text)}. ${what.en}`) };
}

export function checkMarks(sentences, marks) {
  const key = answerKey(sentences);
  const results = marks.map((mark) => {
    let r;
    if (mark.type === 'subject') r = gradeSubject(sentences, mark, key);
    else if (mark.type === 'predicate') r = gradePredicate(sentences, mark, key);
    else if (mark.type === 'connector') r = gradeConnector(sentences, mark, key);
    else r = { verdict: 'note', message: msg('要点として印を付けました（採点なし）。', 'Marked as a key point (not graded).') };
    return { mark, ...r };
  });
  // What Reibun marks that the reader didn't: topics/subjects, main predicates, connectors.
  const missed = key.filter((it) => (it.type !== 'predicate' || it.main) && !marks.some((m) => m.type === it.type && overlaps(m, it)));
  const counts = { good: 0, close: 0, miss: 0, note: 0 };
  for (const r of results) counts[r.verdict]++;
  return { results, missed, counts };
}
