// Reading comprehension: questions on a passage, each with the sentence(s) that
// prove the answer. Pure; input is the sentence list from analyzeText().
//
//   prepareQuestions(sentences, text, written)  hand-written questions (data/passages.json)
//     plus automatic logic questions, in one shape:
//       { id, kind: 'written' | 'logic', prompt, options, answer, evidence: [sentence index],
//         explain, logicOptions? }
//   grade(question, { choice, evidence })  → { right, evidenceRight: true | false | null }

import { LOGIC_BY_ID } from './patterns.js';
import { paragraphChart } from './discourse.js';
import { rng, hash } from './star.js';

// Sentences overlapping a quoted stretch of the passage (where the answer is written).
export function evidenceSentences(sentences, text, quote) {
  const at = text.indexOf(quote);
  if (at < 0 || !quote) return [];
  const end = at + quote.length;
  return sentences.flatMap((s, k) => (s.offset < end && at < s.offset + s.text.length ? [k] : []));
}

// Wrong options for a logic question: the functions most easily mistaken for the answer.
const CONFUSABLE = {
  contrast: ['concession', 'addition', 'result'],
  concession: ['contrast', 'condition', 'cause'],
  cause: ['result', 'example', 'purpose'],
  result: ['cause', 'conclusion', 'condition'],
  addition: ['example', 'sequence', 'contrast'],
  example: ['rephrase', 'addition', 'cause'],
  rephrase: ['conclusion', 'example', 'addition'],
  conclusion: ['result', 'rephrase', 'cause'],
  sequence: ['addition', 'result', 'topic'],
  condition: ['cause', 'concession', 'purpose'],
  purpose: ['cause', 'result', 'condition'],
  topic: ['sequence', 'addition', 'contrast'],
};

// One question per sentence that opens with a linking word: what does it do relative
// to the sentence before? (The first sentence has nothing before it.)
export function logicQuestions(sentences, text) {
  const out = [];
  for (const node of paragraphChart(sentences, text)) {
    if (!node.opener || node.s === 0) continue;
    const answer = node.opener.logic;
    const random = rng(hash(node.text));
    const options = [answer, ...CONFUSABLE[answer]];
    for (let n = options.length - 1; n > 0; n--) {
      const k = Math.floor(random() * (n + 1));
      [options[n], options[k]] = [options[k], options[n]];
    }
    const l = LOGIC_BY_ID.get(answer);
    out.push({
      id: `logic-${node.s}`,
      kind: 'logic',
      sentence: node.s,
      prompt: {
        ja: `第${node.s + 1}文は、前の文に対してどんな働きをしていますか。`,
        en: `What does sentence ${node.s + 1} do in relation to the one before it?`,
      },
      logicOptions: options,
      answer: options.indexOf(answer),
      evidence: [node.s],
      explain: {
        ja: `第${node.s + 1}文は「${node.opener.text}」で始まっています。「${l.ja}」：${l.hint.ja}。`,
        en: `Sentence ${node.s + 1} opens with 「${node.opener.text}」: ${l.en.toLowerCase()}, ${l.hint.en.toLowerCase()}.`,
      },
    });
  }
  return out;
}

// written: [{ id, q, options: [string], answer, evidence: quote, explain: { ja, en } }]
export function prepareQuestions(sentences, text, written = []) {
  const own = written.map((w) => ({
    id: w.id,
    kind: 'written',
    prompt: w.q,
    options: w.options,
    answer: w.answer,
    evidence: evidenceSentences(sentences, text, w.evidence),
    explain: w.explain,
  }));
  return [...own, ...logicQuestions(sentences, text)];
}

export function grade(q, { choice, evidence }) {
  return {
    right: choice === q.answer,
    evidenceRight: evidence == null || !q.evidence.length ? null : q.evidence.includes(evidence),
  };
}
