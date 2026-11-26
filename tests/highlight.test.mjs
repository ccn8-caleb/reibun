// Highlighter grading: marks on a real passage, run with the real tokenizer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTokenizer } from './tokenizer-node.mjs';
import { analyzeText } from '../site/js/engine/analyze.js';
import { answerKey, checkMarks, snapToTokens } from '../site/js/engine/highlight.js';

const tokenizer = await getTokenizer();
const TEXT = '最近、電車がよく遅れる。なぜなら、利用者が増えたからだ。私は雨が降ったので家にいた。';
const sentences = await analyzeText(TEXT, (x) => tokenizer.tokenize(x));

// A mark over the n-th occurrence of `text`.
const at = (type, text, n = 0) => {
  let i = -1;
  for (let k = 0; k <= n; k++) i = TEXT.indexOf(text, i + 1);
  assert.ok(i >= 0, `"${text}" not in passage`);
  return { type, start: i, end: i + text.length };
};
const grade = (...marks) => checkMarks(sentences, marks).results.map((r) => r.verdict);

test('answer key finds subjects, main predicates and connectors', () => {
  const key = answerKey(sentences);
  const pick = (type, extra = () => true) => key.filter((k) => k.type === type && extra(k)).map((k) => k.text);
  assert.deepEqual(pick('subject'), ['電車が', '利用者が', '私は', '雨が']);
  assert.deepEqual(pick('predicate', (k) => k.main), ['遅れる', '増えたからだ', 'いた']);
  assert.ok(pick('connector').includes('なぜなら'));
  assert.ok(pick('connector').includes('ので'));
});

test('subject marks', () => {
  assert.deepEqual(grade(at('subject', '電車が')), ['good']);
  assert.deepEqual(grade(at('subject', '電車')), ['good']); // particle left off: still right
  assert.deepEqual(grade(at('subject', '電車がよく')), ['close']); // too wide
  assert.deepEqual(grade(at('subject', '遅れる')), ['miss']);
  assert.deepEqual(grade(at('subject', '私は雨が')), ['close']); // two subjects in one mark
});

test('predicate marks', () => {
  assert.deepEqual(grade(at('predicate', '遅れる')), ['good']);
  assert.deepEqual(grade(at('predicate', '降ったので')), ['close']); // linked clause, not the main predicate
  assert.deepEqual(grade(at('predicate', '電車が')), ['miss']);
});

test('connector marks name the logic function', () => {
  const r = checkMarks(sentences, [at('connector', 'なぜなら')]).results[0];
  assert.equal(r.verdict, 'good');
  assert.equal(r.item.logic, 'cause');
  assert.deepEqual(grade(at('connector', '最近')), ['miss']);
});

test('key points are not graded; missed items are listed', () => {
  const { results, missed } = checkMarks(sentences, [at('key', '利用者'), at('predicate', '遅れる')]);
  assert.equal(results[0].verdict, 'note');
  assert.ok(!missed.some((m) => m.type === 'predicate' && m.text === '遅れる'));
  assert.ok(missed.some((m) => m.type === 'predicate' && m.text === 'いた'));
});

test('selections snap to whole words, without punctuation', () => {
  const i = TEXT.indexOf('電車');
  assert.deepEqual(snapToTokens(sentences, i + 1, i + 2), { start: i, end: i + 2 }); // 車 → 電車
  const j = TEXT.indexOf('遅れる。');
  assert.deepEqual(snapToTokens(sentences, j, j + 4), { start: j, end: j + 3 }); // drops 。
  assert.equal(snapToTokens(sentences, j + 3, j + 4), null); // only 。
});
