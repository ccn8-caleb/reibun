// ★ drill question generation, with the real tokenizer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  const s = await analyze('次回はもっと計画性を持って行動しようね。');
  const q = makeStarQuestion(s, { seed: 1 });
  assert.equal(q.pieces.length, 4);
  assert.equal(rebuild(q), plain(s.text));
  assert.ok(q.star >= 0 && q.star <= 3);
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
  const s = await analyze('あいつには何を言っても無駄だから、もう口出ししないことにしたんだ。');
  const q = makeStarQuestion(s, { seed: 3 });
  for (const p of q.pieces) assert.ok(!/[。]/.test(p.text) && !/^[、]/.test(p.text), p.text);
  assert.equal(makeStarQuestion(await analyze('はい。')), null);
});

test('drill sentences: one sentence each, matching their pattern; most make a fair question', async () => {
  let made = 0;
  let total = 0;
  for (const p of PATTERNS) {
    if (p.quiet || p.level === 'extra' || NO_DRILL.has(p.id)) continue;
    const text = DRILL_SENTENCES[p.id];
    assert.ok(text, `${p.id} has no drill sentence`);
    const ss = await analyzeText(text, (x) => tokenizer.tokenize(x));
    assert.equal(ss.length, 1, `${p.id}: drill text must be one sentence`);
    assert.ok(ss[0].patterns.some((m) => m.id === p.id), `${p.id}: drill sentence doesn't match: ${text}`);
    total++;
    const q = makeStarQuestion(ss[0], { focus: p.id, seed: 1 });
    if (!q) continue; // more than one right order everywhere: the drill skips it
    made++;
    assert.ok(q.before && q.after.replace(/[。！？]/g, ''), `${p.id}: no context`);
    assert.equal(rebuild(q), plain(text), p.id);
  }
  for (const id of Object.keys(DRILL_SENTENCES)) assert.ok(PATTERNS.some((p) => p.id === id), `drill sentence for unknown pattern ${id}`);
  // Raise this as sentences are rewritten to allow only one order.
  assert.ok(made >= 230, `only ${made} of ${total} drill sentences make a fair question`);
});

test('the ★ goes where every valid order agrees, and other valid orders count as right', async () => {
  const s = await analyze('今日は何もしないで家でごろごろしていたい気分だよ。');
  const q = makeStarQuestion(s, { focus: 'mo-negative', seed: 1 });
  const id = (text) => q.pieces.find((p) => p.text === text).id;
  // 家で can also come first (家で何もしないで…), so only ごろごろしていたい is certain.
  assert.equal(q.pieces.find((p) => p.id === q.answer).text, 'ごろごろしていたい');
  assert.ok(isRightOrder(q, [id('家で'), id('何も'), id('しないで'), id('ごろごろしていたい')]));
  assert.ok(!isRightOrder(q, [id('しないで'), id('何も'), id('家で'), id('ごろごろしていたい')]));
});

test('short sentences without room for context give no question', async () => {
  assert.equal(makeStarQuestion(await analyze('雨が降っている。')), null);
});

// The Tatoeba bank (site/data/bank, built by `go run ./tools/reibun tatoeba build`)
// must still make a question for its grammar point; a matcher change that breaks an
// entry means rebuilding the bank.
test('every bank sentence still makes a question for its grammar point', async () => {
  for (const level of ['n5', 'n4', 'n3', 'n2', 'n1']) {
    const bank = JSON.parse(readFileSync(new URL(`../site/data/bank/${level}.json`, import.meta.url), 'utf8'));
    assert.equal(bank.license, 'CC BY 2.0 FR');
    for (const item of bank.items) {
      const [s] = await analyzeText(item.ja, (x) => tokenizer.tokenize(x));
      assert.ok(makeStarQuestion(s, { focus: item.p }), `${level} #${item.t} (${item.p}): ${item.ja} — rebuild the bank`);
      assert.ok(item.en && item.by && Number.isInteger(item.t));
    }
  }
});
