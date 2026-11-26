// ★ drill question generation, with the real tokenizer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTokenizer } from './tokenizer-node.mjs';
import { analyzeText } from '../site/js/engine/analyze.js';
import { PATTERNS } from '../site/js/engine/patterns.js';
import { makeStarQuestion, isRightOrder } from '../site/js/engine/star.js';

const tokenizer = await getTokenizer();
const analyze = async (text) => (await analyzeText(text, (x) => tokenizer.tokenize(x)))[0];

// The pieces in the right order, with the visible text, rebuild the sentence.
const rebuild = (q) => (q.before + q.order.map((id) => q.pieces.find((p) => p.id === id).text).join('') + q.after).replace(/、/g, '');
const plain = (s) => s.replace(/、/g, '');

test('a question rebuilds its sentence and stars one slot', async () => {
  const s = await analyze('私は昨日友達と新しい映画を見に行きました。');
  const q = makeStarQuestion(s, { seed: 1 });
  assert.equal(q.pieces.length, 4);
  assert.equal(rebuild(q), plain(s.text));
  assert.ok(q.star >= 1 && q.star <= 2);
  assert.equal(q.answer, q.order[q.star]);
  assert.notDeepEqual(q.pieces.map((p) => p.id), q.order); // actually shuffled
  assert.ok(isRightOrder(q, q.order));
  assert.ok(!isRightOrder(q, [...q.order].reverse()));
});

test('same seed, same question; the blanks cover the focus pattern', async () => {
  const s = await analyze('約束したのに、彼は来なかった。');
  const a = makeStarQuestion(s, { seed: 7, focus: 'noni' });
  const b = makeStarQuestion(s, { seed: 7, focus: 'noni' });
  assert.deepEqual(a, b);
  assert.equal(a.focus, 'noni');
  const blanks = a.order.map((id) => a.pieces.find((p) => p.id === id).text).join('');
  assert.ok(blanks.includes('のに'));
});

test('no sentence end inside the blanks; too-short sentences give null', async () => {
  const s = await analyze('雨が降っても、試合は行います。');
  const q = makeStarQuestion(s, { seed: 3 });
  for (const p of q.pieces) assert.ok(!/[。]/.test(p.text) && !/^[、]/.test(p.text), p.text);
  assert.equal(makeStarQuestion(await analyze('はい。')), null);
});

test('most grammar examples make a question that covers their pattern', async () => {
  let made = 0;
  for (const p of PATTERNS) {
    const s = await analyze(p.ex);
    const q = makeStarQuestion(s, { focus: p.id });
    if (!q) continue;
    made++;
    assert.equal(rebuild(q), plain(s.text), p.id);
    assert.equal(new Set(q.pieces.map((x) => x.text)).size, 4, p.id);
  }
  // Short examples can't always hold four pieces around their pattern.
  assert.ok(made / PATTERNS.length > 0.9, `only ${made} of ${PATTERNS.length}`);
});
