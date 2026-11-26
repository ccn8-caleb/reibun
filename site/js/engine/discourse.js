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
