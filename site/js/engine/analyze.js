// The analysis pipeline shared by every tool:
//
//   text → sentences → tokens → bunsetsu (+ roles, attachment, conjugation) → patterns
//
// analyzeSentence() is pure given a tokenizer function, so it runs in the browser
// (tokenizer.js, in a worker) and under Node for tests (tests/tokenizer-node.mjs).

import { normalize, splitSentences } from './tokens.js';
import { chunk } from './bunsetsu.js';
import { assignRoles, skeleton } from './roles.js';
import { conjugation } from './conjugation.js';
import { findPatterns } from './patterns.js';

export function analyzeSentence(text, rawTokens, offset = 0) {
  const tokens = normalize(rawTokens);
  const chunks = assignRoles(chunk(tokens));
  for (const b of chunks) b.conj = conjugation(b);
  markVoiceRoles(chunks);
  const patterns = findPatterns(tokens);
  // です / ます anywhere (行くんです puts です after the nominalizer, outside the chain).
  const politeness = tokens.some((t) => t.pos === '助動詞' && ['特殊・マス', '特殊・デス'].includes(t.ctype)) ? 'polite' : 'plain';
  return { text, offset, tokens, chunks, patterns, skeleton: skeleton(chunks), politeness };
}

// に with a passive verb marks the agent (先生に褒められた); with a causative verb
// (but not causative-passive) it marks who is made to act (子供に食べさせる).
function markVoiceRoles(chunks) {
  for (const b of chunks) {
    if (b.role !== 'target' || b.dep < 0) continue;
    const keys = chunks[b.dep].conj?.layers.map((l) => l.key) || [];
    if (keys.some((k) => k.startsWith('passive'))) b.role = 'agent';
    else if (keys.includes('causative')) b.role = 'causee';
  }
}

// tokenize: (text) => raw kuromoji tokens, sync or async.
export async function analyzeText(text, tokenize) {
  const out = [];
  for (const s of splitSentences(text)) out.push(analyzeSentence(s.text, await tokenize(s.text), s.offset));
  return out;
}
