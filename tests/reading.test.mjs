// Reading comprehension: the sample passages' questions and the automatic logic questions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getTokenizer } from './tokenizer-node.mjs';
import { analyzeText } from '../site/js/engine/analyze.js';
import { prepareQuestions, logicQuestions, grade, evidenceSentences } from '../site/js/engine/reading.js';
import { LOGIC_BY_ID } from '../site/js/engine/patterns.js';

const tokenizer = await getTokenizer();
const passages = JSON.parse(readFileSync(new URL('../site/data/passages.json', import.meta.url), 'utf8'));

test('every written question is well formed and its evidence is in the passage', async () => {
  const ids = new Set();
  for (const p of passages) {
    assert.ok(!ids.has(p.id), `duplicate passage ${p.id}`);
    ids.add(p.id);
    const sentences = await analyzeText(p.ja, (x) => tokenizer.tokenize(x));
    for (const w of p.questions || []) {
      assert.equal(w.options.length, 4, `${p.id}/${w.id}: four options`);
      assert.ok(w.answer >= 0 && w.answer < 4, `${p.id}/${w.id}: answer index`);
      assert.equal(new Set(w.options).size, 4, `${p.id}/${w.id}: options differ`);
      assert.ok(p.ja.includes(w.evidence), `${p.id}/${w.id}: evidence not in passage: ${w.evidence}`);
      assert.ok(evidenceSentences(sentences, p.ja, w.evidence).length, `${p.id}/${w.id}: no evidence sentence`);
      assert.ok(w.explain.ja && w.explain.en, `${p.id}/${w.id}: explanation`);
      assert.ok(w.en?.q && w.en.options?.length === 4 && w.en.options.every(Boolean), `${p.id}/${w.id}: question and options in English`);
    }
  }
});

test('logic questions follow the connectives', async () => {
  const p = passages.find((x) => x.id === 'p004'); // しかし / つまり / したがって
  const sentences = await analyzeText(p.ja, (x) => tokenizer.tokenize(x));
  const qs = logicQuestions(sentences, p.ja);
  assert.deepEqual(qs.map((q) => q.logicOptions[q.answer]), ['contrast', 'rephrase', 'result']);
  for (const q of qs) {
    assert.equal(new Set(q.logicOptions).size, 4);
    assert.ok(q.logicOptions.every((l) => LOGIC_BY_ID.has(l)));
    assert.deepEqual(q.evidence, [q.sentence]);
  }
});

test('grading checks the answer and the evidence separately', async () => {
  const p = passages.find((x) => x.id === 'p003');
  const sentences = await analyzeText(p.ja, (x) => tokenizer.tokenize(x));
  const [q] = prepareQuestions(sentences, p.ja, p.questions);
  assert.deepEqual(q.evidence, [1]);
  assert.deepEqual(grade(q, { choice: 1, evidence: 1 }), { right: true, evidenceRight: true });
  assert.deepEqual(grade(q, { choice: 1, evidence: 0 }), { right: true, evidenceRight: false });
  assert.deepEqual(grade(q, { choice: 0 }), { right: false, evidenceRight: null });
});
