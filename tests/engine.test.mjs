// Engine tests: run with `node --test tests/` after `go run ./tools/reibun kuromoji fetch`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTokenizer } from './tokenizer-node.mjs';
import { analyzeText } from '../site/js/engine/analyze.js';
import { readFileSync } from 'node:fs';
import { PATTERNS, PATTERN_BY_ID, GROUPS, LEVELS, visiblePatterns } from '../site/js/engine/patterns.js';
import { rubyParts, splitSentences } from '../site/js/engine/tokens.js';

const tokenizer = await getTokenizer();
const analyze = async (text) => (await analyzeText(text, (s) => tokenizer.tokenize(s)))[0];
const ids = (s) => s.patterns.map((p) => p.id);
const patternIds = (s) => visiblePatterns(s.patterns).map((p) => p.id);

for (const p of PATTERNS) {
  test(`pattern ${p.id}: ${p.ex}`, async () => {
    assert.ok(p.ex, `${p.id} has no example sentence`);
    const s = await analyze(p.ex);
    assert.ok(ids(s).includes(p.id), `expected ${p.id}, got [${ids(s).join(', ')}]`);
  });
}

test('pattern ids are unique and groups exist', () => {
  const seen = new Set();
  for (const p of PATTERNS) {
    assert.ok(!seen.has(p.id), `duplicate pattern id ${p.id}`);
    seen.add(p.id);
    assert.ok(GROUPS.some((g) => g.id === p.group), `${p.id}: unknown group ${p.group}`);
    assert.ok(LEVELS.includes(p.level), `${p.id}: bad level ${p.level}`);
  }
});

// The starter sentences (site/data/samples.json) must show the patterns they're there for.
const samples = JSON.parse(readFileSync(new URL('../site/data/samples.json', import.meta.url), 'utf8'));
for (const smp of samples) {
  test(`sample ${smp.id} shows ${smp.focus.join(', ')}`, async () => {
    const found = (await analyzeText(smp.ja, (x) => tokenizer.tokenize(x))).flatMap(patternIds);
    for (const id of smp.focus) {
      assert.ok(PATTERN_BY_ID.has(id), `${smp.id}: unknown pattern ${id}`);
      assert.ok(found.includes(id), `${smp.id}: expected ${id}, got [${found.join(', ')}]`);
    }
  });
}

test('generic patterns are hidden inside longer ones', async () => {
  const s = await analyze('薬を飲まなければならない。');
  assert.ok(!ids(s).includes('ba'));
  const c = await analyze('子供に野菜を食べさせられた。');
  assert.ok(!ids(c).includes('causative') && !ids(c).includes('passive'));
});

const roles = (s) => s.chunks.map((b) => `${b.text.replace(/[。、]/g, '')}:${b.role}`);

test('roles and attachment: simple sentence', async () => {
  const s = await analyze('私は昨日友達と新しい映画を見に行きました。');
  assert.deepEqual(roles(s), ['私は:topic', '昨日:time', '友達と:companion', '新しい:modifier', '映画を:object', '見に:adverbial', '行きました:predicate']);
  assert.deepEqual(s.chunks.map((b) => b.dep), [6, 5, 5, 4, 5, 6, -1]);
  assert.equal(s.politeness, 'polite');
});

test('roles: relative clause and linked clause', async () => {
  const s = await analyze('彼が書いた手紙を読んだ。');
  assert.deepEqual(roles(s), ['彼が:subject', '書いた:modifier', '手紙を:object', '読んだ:predicate']);
  assert.equal(s.chunks[0].dep, 1); // 彼が → 書いた (inside the relative clause)
  const t = await analyze('雨が降っているので、家で本を読んでいます。');
  assert.equal(t.chunks[1].role, 'clause');
  assert.equal(t.chunks[1].roleInfo.connector, 'ので');
});

test('に with passive / causative verbs', async () => {
  const p = await analyze('先生に褒められた。');
  assert.equal(p.chunks[0].role, 'agent');
  const c = await analyze('子供に野菜を食べさせた。');
  assert.equal(c.chunks[0].role, 'causee');
  const t = await analyze('学校に行った。');
  assert.equal(t.chunks[0].role, 'target');
});

test('topic reaches the main predicate', async () => {
  const s = await analyze('私は雨が降ったので家にいた。');
  assert.equal(s.chunks[0].dep, s.chunks.length - 1);
});

test('conjugation chains', async () => {
  const s = await analyze('子供に野菜を食べさせられた。');
  const c = s.chunks[2].conj;
  assert.equal(c.base, '食べる');
  assert.equal(c.cls, 'ichidan');
  assert.deepEqual(c.layers.map((l) => l.key), ['causative', 'passive', 'past']);
  const n = (await analyze('高くなかった。')).chunks[0].conj;
  assert.equal(n.cls, 'i-adj');
  assert.ok(n.negative && n.past && !n.polite);
  const suru = (await analyze('毎日勉強しています。')).chunks[1].conj;
  assert.equal(suru.base, '勉強する');
  assert.equal(suru.cls, 'suru-noun');
  assert.deepEqual(suru.layers.map((l) => l.key), ['te', 'progressive', 'polite']);
});

test('furigana alignment', () => {
  assert.deepEqual(rubyParts('食べさせ', 'たべさせ'), [{ text: '食', rt: 'た' }, { text: 'べさせ' }]);
  assert.deepEqual(rubyParts('お茶', 'おちゃ'), [{ text: 'お' }, { text: '茶', rt: 'ちゃ' }]);
  assert.deepEqual(rubyParts('日本語', 'にほんご'), [{ text: '日本語', rt: 'にほんご' }]);
  assert.deepEqual(rubyParts('ひらがな', 'ひらがな'), [{ text: 'ひらがな' }]);
});

test('sentence splitting keeps offsets and closing quotes', () => {
  const text = '「行こう。」と言った。 次の文！';
  const parts = splitSentences(text);
  assert.deepEqual(parts.map((p) => p.text), ['「行こう。」', 'と言った。', '次の文！']);
  for (const p of parts) assert.equal(text.slice(p.offset, p.offset + p.text.length), p.text);
});
