// Sentence bank, step 2 of 2 (step 1 is `go run ./tools/reibun tatoeba prepare`).
//
//   node tools/bank/build.mjs <candidates.tsv> <out-dir>
//
// Runs every candidate through the real tokenizer, grammar matcher and ★ question
// builder, gives each usable sentence to one grammar point (the one with the fewest
// sentences so far, so rarer points get covered), up to PER_PATTERN per point, and
// writes <out-dir>/<level>.json. Sentences written in Japanese come before ones
// translated into it.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getTokenizer } from '../../tests/tokenizer-node.mjs';
import { analyzeText } from '../../site/js/engine/analyze.js';
import { PATTERNS, PATTERN_BY_ID, LEVELS } from '../../site/js/engine/patterns.js';
import { makeStarQuestion, hash } from '../../site/js/engine/star.js';
import { NO_DRILL } from '../../site/js/engine/grammar/drill.js';

const PER_PATTERN = 20;
const [candidatesPath, outDir] = process.argv.slice(2);
if (!candidatesPath || !outDir) {
  console.error('usage: node tools/bank/build.mjs <candidates.tsv> <out-dir>');
  process.exit(2);
}

const drillable = (id) => {
  const p = PATTERN_BY_ID.get(id);
  return p && !p.quiet && p.level !== 'extra' && !NO_DRILL.has(id);
};

const rows = readFileSync(candidatesPath, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [id, ja, en, owner, origin] = line.split('\t');
    return { id: Number(id), ja, en, owner, origin };
  })
  // Originals first; a stable shuffle within each group so no owner or era dominates.
  .sort((a, b) => (a.origin === b.origin ? hash(a.ja) - hash(b.ja) : a.origin === 'orig' ? -1 : 1));

const tokenizer = await getTokenizer();
const count = new Map(PATTERNS.map((p) => [p.id, 0]));
const picked = [];
let usable = 0;
const t0 = Date.now();

for (const [n, row] of rows.entries()) {
  if (n % 5000 === 0) console.log(`bank: ${n}/${rows.length} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  const ss = await analyzeText(row.ja, (x) => tokenizer.tokenize(x));
  if (ss.length !== 1) continue;
  const s = ss[0];
  const options = [...new Set(s.patterns.map((m) => m.id))].filter((id) => drillable(id) && count.get(id) < PER_PATTERN);
  // The least-covered point this sentence can make a fair question for.
  options.sort((a, b) => count.get(a) - count.get(b) || LEVELS.indexOf(PATTERN_BY_ID.get(b).level) - LEVELS.indexOf(PATTERN_BY_ID.get(a).level));
  for (const id of options) {
    if (!makeStarQuestion(s, { focus: id, seed: hash(row.ja) })) continue;
    usable++;
    count.set(id, count.get(id) + 1);
    picked.push({ t: row.id, ja: row.ja, en: row.en, by: row.owner, p: id, level: PATTERN_BY_ID.get(id).level });
    break;
  }
}

mkdirSync(outDir, { recursive: true });
const built = new Date().toISOString().slice(0, 10);
for (const level of LEVELS.filter((l) => l !== 'extra')) {
  const items = picked.filter((x) => x.level === level).map(({ level: _, ...x }) => x);
  items.sort((a, b) => PATTERNS.findIndex((p) => p.id === a.p) - PATTERNS.findIndex((p) => p.id === b.p) || a.t - b.t);
  const file = {
    source: 'Tatoeba',
    url: 'https://tatoeba.org',
    license: 'CC BY 2.0 FR',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/fr/',
    note: 'Sentences by native speakers of Japanese (by = Tatoeba username), chosen by tools/bank/build.mjs. Each has a page: https://tatoeba.org/sentences/show/<t>',
    built,
    items,
  };
  writeFileSync(join(outDir, `${level.toLowerCase()}.json`), JSON.stringify(file, null, 0).replace(/\},\{/g, '},\n{') + '\n');
  const covered = new Set(items.map((x) => x.p)).size;
  const total = PATTERNS.filter((p) => p.level === level && drillable(p.id)).length;
  console.log(`bank: ${level}: ${items.length} sentences covering ${covered}/${total} grammar points`);
}
const empty = PATTERNS.filter((p) => drillable(p.id) && count.get(p.id) === 0).map((p) => p.id);
console.log(`bank: ${usable} sentences from ${rows.length} candidates in ${((Date.now() - t0) / 1000).toFixed(0)}s; no sentences for ${empty.length} points`);
