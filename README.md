# 例文 Reibun

An in-browser, zero-backend toolkit for **breaking Japanese sentences down**: words,
phrases, what each phrase is doing, conjugations and grammar patterns. A sister app
to [Kanji Nexus](https://kanjinexus.concatn8.com/) with the same look and shell.

Everything runs client-side from static files. There are no accounts and no server.

Live at **https://reibun.concatn8.com/** (deployed from `master`).

| Page | Purpose |
| :--- | :--- |
| **Breakdown** (`index.html`) | Paste text. Each sentence is split into phrases (文節) with furigana, word-class colours and phrase roles, plus the sentence skeleton, connection threads (what attaches to what), the grammar patterns it uses, and for several sentences a logic-flow chart of the argument (cause → example → conclusion…). Tap anything for the inspector: conjugation chain, dictionary entry, grammar notes. `index.html?s=<text>` deep-links a sentence. |
| **Reading** (`highlight.html`) | Read a passage with pens (topic/subject, predicate, connector, key point) and check your marks against Reibun's analysis, then answer questions: hand-written ones for the sample passages and a logic question for every sentence opening with a linking word (on any passage). Tap the sentence that proves each answer; both are graded (`engine/reading.js`). |
| **★ Drill** (`drill.html`) | JLPT-style word ordering: four shuffled pieces, one blank marked ★. Pick the ★ piece, or order all four. Questions come from drill sentences (by level), about 2,800 Tatoeba sentences by native speakers (by level, with English), your Library, or the sample passages (`engine/star.js` builds them; the ★ only goes where every valid word order agrees). |
| **Grammar** (`grammar.html`) | The pattern catalog (about 490 JLPT points, N5–N1, plus about 50 connectives such as しかし and したがって), filterable by level, grammar group and logic function (cause, contrast, example, conclusion…), and searchable, each with an example that opens in Breakdown. `grammar.html#te-iru` links to one pattern. |
| **Library** (`library.html`) | Sentences you saved, with a translation and note. |

## How the analysis works

`site/js/engine/` is a small pipeline with no DOM dependencies:

1. **Tokens** (`tokens.js`): [kuromoji.js](https://github.com/takuyaa/kuromoji.js)
   with IPADIC, running in a Web Worker (`tokenizer.js`, `tokenizer-worker.js`).
2. **Bunsetsu** (`bunsetsu.js`): one content word plus the particles and helpers
   attached to it, using the usual IPADIC chunking rules.
3. **Roles & attachment** (`roles.js`): each phrase's role from its closing particle
   or its form, and which phrase it attaches to. Noun modifiers attach to the next
   noun; arguments attach to the next predicate; は reaches the main predicate.
   This is a teaching heuristic, not a full parser: ambiguous sentences get the most
   common reading.
4. **Conjugation** (`conjugation.js`): the stack of auxiliaries on each verb or
   adjective, in order.
5. **Patterns** (`patterns.js`): the matcher. The catalog is in `grammar/n5.js` …
   `grammar/n1.js`, one file per JLPT level: each grammar point is a sequence of token
   tests (or a phrase matched however the tokenizer split it) with an example
   sentence. There is no official JLPT grammar list, so levels follow the common
   study lists. `grammar/connectives.js` holds connectives outside the JLPT lists,
   and `grammar/logic.js` tags patterns with their logic function.
6. **Discourse** (`discourse.js`): `logicFlow()` lists the logic functions a text uses;
   `paragraphChart()` gives each sentence's opening link and inner links for the chart.
   `threads.js` lays out the connection-thread lines.

### Sentence bank (Tatoeba)

`site/data/bank/n5.json` … `n1.json` hold example sentences from
[Tatoeba](https://tatoeba.org), licensed [CC BY 2.0 FR](https://creativecommons.org/licenses/by/2.0/fr/):
each item keeps its Tatoeba id (`t`), author (`by`), English translation (`en`) and
grammar point (`p`). To refresh it from the weekly exports:

```bash
go run ./tools/reibun tatoeba build     # downloads into cache/ (git-ignored), then runs tools/bank/build.mjs
```

The tests check that every bank sentence still makes a question for its grammar point,
so a matcher change that breaks entries fails CI until the bank is rebuilt.

### Adding a grammar pattern

Add an entry to the level's file in `site/js/engine/grammar/` with an example
sentence (`ex`); the step syntax is described at the top of `patterns.js`. Then run
the tests: every pattern must match its own example, and every starter sentence
(`site/data/samples.json`) must still show the patterns in its `focus`.

```bash
go run ./tools/reibun kuromoji fetch   # once: tokenizer dictionary for tests
node --test tests/*.test.mjs
```

## Running it

The pages use ES modules and a Web Worker, so serve them over HTTP:

```bash
go run ./tools/reibun kuromoji fetch          # tokenizer dictionary → site/kuromoji/dict
python3 -m http.server -d site 8000           # or: docker compose up -d (port 8889)
```

**Dictionary lookups** (optional locally) use the same JMdict shards as Kanji Nexus.
Download a `jmdict-eng-*.json.tgz` from
[jmdict-simplified](https://github.com/scriptin/jmdict-simplified/releases), extract it,
then run `go run ./tools/reibun dict build <jmdict-eng.json> site/dict`. Without it, the
inspector just says there's no dictionary data.

Both downloads are git-ignored. CI fetches them at deploy time.

## Tooling (`tools/reibun`, Go, no dependencies)

```
reibun lint [file]                         check site/data/samples.json
reibun kuromoji fetch [out-dir]            download the pinned, checksummed tokenizer dictionary
reibun dict build <jmdict.json> <out-dir>  JMdict shards for lookups
```

## Releases

Branches: feature → `development` (checks only) → `master` (deploys `site/` to GitHub
Pages via `.github/workflows/static.yml`, served at reibun.concatn8.com behind
Cloudflare). Check what's live with `curl -s https://reibun.concatn8.com/ | grep app-version`. Every release bumps the patch number in
`site/js/core/version.js` and needs a matching `CHANGELOG.md` entry.

## Your data

Saved sentences live in your browser's `localStorage`. Use the **Data** panel to
download or load a `.json` backup, or to erase everything.

## Credits

- Morphological analysis: [kuromoji.js](https://github.com/takuyaa/kuromoji.js)
  (Apache-2.0) with IPADIC. See `site/js/vendor/kuromoji-LICENSE.txt` and
  `kuromoji-NOTICE.md`. The vendored build carries one local patch, marked
  `[reibun patch]`.
- Dictionary: [JMdict](https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project),
  property of the EDRDG, used under its [licence](https://www.edrdg.org/edrdg/licence.html)
  (CC BY-SA 4.0).
- Fonts and icons: [Inter](https://rsms.me/inter/) (OFL) and [Lucide](https://lucide.dev) (ISC).
