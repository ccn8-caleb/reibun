// The line of reasoning across a text: which logic function (cause, contrast,
// example, conclusion…) each sentence uses, in order. Pure; the input is the
// sentence list from analyzeText(). This is the data a paragraph chart draws.

import { PATTERN_BY_ID } from './patterns.js';

// [{ s, id, logic, start, end }] — one entry per logic-tagged match, in text order.
export function logicFlow(sentences) {
  const flow = [];
  sentences.forEach((sentence, s) => {
    for (const m of sentence.patterns) {
      const logic = PATTERN_BY_ID.get(m.id).logic;
      if (logic) flow.push({ s, id: m.id, logic, start: m.start, end: m.end });
    }
  });
  return flow;
}

// One node per sentence for the paragraph chart:
//   { s, text, para, opener, inner }
// opener: the logic link that opens the sentence (なぜなら, したがって…): how it
// relates to what came before. inner: logic links inside it (〜ので, 〜けど…).
// para counts paragraphs (a blank line in `text` starts a new one).
export function paragraphChart(sentences, text = '') {
  let para = 0;
  let prevEnd = 0;
  return sentences.map((s, k) => {
    if (k > 0 && /\n\s*\n/.test(text.slice(prevEnd, s.offset))) para++;
    prevEnd = s.offset + s.text.length;
    const first = s.tokens.findIndex((t) => t.pos !== '記号');
    const links = [];
    const seen = new Set();
    for (const m of s.patterns) {
      const p = PATTERN_BY_ID.get(m.id);
      if (!p.logic) continue;
      const span = `${m.start}:${m.end}`;
      if (seen.has(span)) continue;
      seen.add(span);
      const words = s.tokens.slice(m.start, m.end).filter((t) => t.pos !== '記号');
      links.push({ id: p.id, logic: p.logic, text: words.map((t) => t.surface).join(''), initial: m.start === first });
    }
    const opener = links.find((l) => l.initial) || null;
    return { s: k, text: s.text, para, opener, inner: links.filter((l) => l !== opener) };
  });
}
