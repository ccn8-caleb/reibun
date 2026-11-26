// ★ drill question generation, with the real tokenizer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTokenizer } from './tokenizer-node.mjs';
import { analyzeText } from '../site/js/engine/analyze.js';
import { PATTERNS } from '../site/js/engine/patterns.js';
import { makeStarQuestion, isRightOrder } from '../site/js/engine/star.js';
import { DRILL_SENTENCES, NO_DRILL } from '../site/js/engine/grammar/drill.js';

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
  const s = await analyze('彼は来ると約束したのに、パーティーに来なかったので、みんな怒っています。');
  const a = makeStarQuestion(s, { seed: 7, focus: 'noni' });
  const b = makeStarQuestion(s, { seed: 7, focus: 'noni' });
  assert.deepEqual(a, b);
  assert.equal(a.focus, 'noni');
  const blanks = a.order.map((id) => a.pieces.find((p) => p.id === id).text).join('');
  assert.ok(blanks.includes('のに'));
});

test('no sentence end inside the blanks; too-short sentences give null', async () => {
  const s = await analyze('明日はたとえ雨が降っても、予定どおりに試合を行います。');
  const q = makeStarQuestion(s, { seed: 3 });
  for (const p of q.pieces) assert.ok(!/[。]/.test(p.text) && !/^[、]/.test(p.text), p.text);
  assert.equal(makeStarQuestion(await analyze('はい。')), null);
});

test('every drill sentence makes a question with context that covers its pattern', async () => {
  for (const p of PATTERNS) {
    if (p.quiet || p.level === 'extra' || NO_DRILL.has(p.id)) continue;
    const text = DRILL_SENTENCES[p.id];
    assert.ok(text, `${p.id} has no drill sentence`);
    const ss = await analyzeText(text, (x) => tokenizer.tokenize(x));
    assert.equal(ss.length, 1, `${p.id}: drill text must be one sentence`);
    assert.ok(ss[0].patterns.some((m) => m.id === p.id), `${p.id}: drill sentence doesn't match: ${text}`);
    const q = makeStarQuestion(ss[0], { focus: p.id, seed: 1 });
    assert.ok(q, `${p.id}: no question from ${text}`);
    assert.ok(q.before && q.after.replace(/[。！？]/g, ''), `${p.id}: no context`);
    assert.equal(rebuild(q), plain(text), p.id);
  }
  for (const id of Object.keys(DRILL_SENTENCES)) assert.ok(PATTERNS.some((p) => p.id === id), `drill sentence for unknown pattern ${id}`);
});

test('short sentences without room for context give no question', async () => {
  assert.equal(makeStarQuestion(await analyze('雨が降っている。')), null);
});
