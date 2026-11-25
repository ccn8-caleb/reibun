// Dictionary lookups from bundled JMdict shards (site/dict/<hex code point>.json),
// built at deploy time by the `dict build` tool (shared with Kanji Nexus). One small file per first
// character is fetched on demand and cached; offline, the service worker serves the
// shards you've already used.
//
// JMdict is property of the Electronic Dictionary Research and Development Group,
// used under its licence (CC BY-SA 4.0).
//
// Entry: { r: [readings], c?: 1 (common), s: [{ p: [parts of speech], g: "glosses" }], uk?: 1 }

import { BUILD } from './version.js';
import { toHiragana } from './util.js';

export const DICT_CREDIT = { name: 'JMdict', url: 'https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project' };

const shards = new Map(); // file name → Promise<object | null>
let unavailable = false;

function shardUrl(word) {
  const hex = [...word][0].codePointAt(0).toString(16);
  return new URL(`../../dict/${hex}.json?v=${BUILD}`, import.meta.url);
}

// Returns the entries for this exact spelling ([] if none), or null if the
// dictionary isn't installed (e.g. local development without `dict build`).
export async function lookup(word) {
  word = String(word || '').trim();
  if (!word || unavailable) return unavailable ? null : [];
  const url = shardUrl(word);
  if (!shards.has(url.href)) {
    shards.set(
      url.href,
      fetch(url)
        .then(async (res) => {
          if (res.status === 404) {
            // Missing shard: either no words start with this character, or no
            // dictionary at all. meta.json tells them apart.
            const meta = await fetch(new URL(`../../dict/meta.json?v=${BUILD}`, import.meta.url)).catch(() => null);
            if (!meta?.ok) unavailable = true;
            return {};
          }
          if (!res.ok) throw new Error(`dictionary ${res.status}`);
          return res.json();
        })
        .catch((err) => {
          shards.delete(url.href); // retry later (e.g. offline)
          throw err;
        })
    );
  }
  const shard = await shards.get(url.href);
  if (unavailable) return null;
  return shard[word] || [];
}

// Best entry: one whose readings include `reading` (e.g. from the IME), else the
// first (common words come first).
export function pickEntry(entries, reading) {
  if (!entries?.length) return null;
  const want = toHiragana(reading || '');
  return (want && entries.find((e) => e.r.some((r) => toHiragana(r) === want))) || entries[0];
}

// "structure; construction" or "① living thing; organism ② biology".
// Mirrors meaningText() in the Go dict tool.
export function meaningText(entry) {
  if (!entry) return '';
  if (entry.s.length === 1) return entry.s[0].g;
  return entry.s.map((s, i) => `${'①②③④⑤'[i]} ${s.g}`).join(' ');
}

// JMdict part-of-speech codes → grammar tags (same ids as Kanji Nexus).
const POS_TAGS = {
  vs: 'suru', 'vs-s': 'suru', 'vs-i': 'suru', 'vs-c': 'suru',
  vi: 'intransitive',
  vt: 'transitive',
  'adj-na': 'na-adj',
  'adj-i': 'i-adj', 'adj-ix': 'i-adj',
  adv: 'adverb', 'adv-to': 'adverb',
};

export function tagsFor(entry) {
  if (!entry) return [];
  const tags = new Set();
  for (const s of entry.s) for (const p of s.p) if (POS_TAGS[p]) tags.add(POS_TAGS[p]);
  if (entry.uk) tags.add('kana');
  return [...tags];
}
