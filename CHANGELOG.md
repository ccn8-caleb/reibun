# Changelog

Versions follow [semver](https://semver.org/). The version lives in
`site/js/core/version.js`; every release needs an entry here (CI checks it). Each
deploy also carries a build id (commit hash), shown next to the version in the app.

**Numbering (from 0.2.0):** every release bumps the patch number (0.2.1, 0.2.2, …,
0.2.15 is fine). The minor number only moves for a milestone called out on purpose.

## [0.2.4] — 2026-11-26 — Tatoeba sentence bank

### Added
- **Tatoeba sentences in the ★ drill:** about 2,800 real example sentences from
  [Tatoeba](https://tatoeba.org) (CC BY 2.0 FR), each written by a native speaker
  of Japanese and tagged with the grammar point it practises (N5–N1). After each
  answer you see the English translation and a link to the sentence on Tatoeba
  with its author. The credit is on the drill page and in the app's About line.
- `go run ./tools/reibun tatoeba build` downloads the weekly Tatoeba exports and
  rebuilds the bank. It keeps sentences by native speakers whose origin is known,
  with an English translation and a sensible length, then keeps only those that
  make a fair ★ question for a grammar point (at most 20 per point).

### Changed
- **★ questions have one right answer.** Japanese word order is free: phrases like
  家で and 何も can swap. The ★ now goes only where every valid order puts the
  same piece. In 全部並べる, any valid order counts as right. Pieces are never a
  bare particle (が, を).

### Fixed
- Many grammar points no longer fire on look-alike words (found by running
  thousands of Tatoeba sentences through the matcher). For example: お下げ is not
  〜げ, わめく is not 〜めく, 椅子の下で is not 〜のもとで, 目を通して is not
  〜を通じて, 風に当たって is not 〜にあたって, 楽しみにしている is not 〜にする,
  私のようになりたい is not 〜ようになる, 友達の間に (between) is not 〜間に
  (during), and が最後のひとつ is not 〜が最後.

## [0.2.3] — 2026-11-26 — ★ drill

### Added
- **★ drill** (★ドリル, `drill.html`): JLPT-style word ordering (文法 ② 並べ替え).
  A sentence has four blanks, one marked ★, and four shuffled pieces.
  - **★のみ:** pick the piece for ★, as in the exam.
  - **全部並べる:** put all four in order. Tap a filled slot to take a piece back.
  - **Questions from:** about 470 drill sentences, one per grammar point at N5–N1
    (choose levels, with the grammar point shown after each answer), your Library,
    or the sample passages.
  - Like the exam, the blanks always have context before and after them. Each drill
    sentence is longer than the Grammar page example and puts the point mid-sentence.
  - Ten per round, with the full sentence and a link to Breakdown after each
    answer, a score at the end, and a retry of the ones you missed. Keys 1–4 pick
    a piece, and Enter goes on.
- Pieces follow natural boundaries: whole phrases where possible, never inside an
  inflection (降っ|て), and the blanks centre on the grammar point being practised.

### Fixed
- 〜て形 (shown only on tap) no longer hides the pattern inside it: ほめられて shows
  受身 again, and 食べすぎて shows 〜すぎる.
- Patterns that only matched right before 。 now also match mid-sentence:
  〜一方だと, 〜ものかと, 〜ことか、, 〜とは、, 〜に限ると, 〜もんと.
- 〜ばかりで, 〜には及びません and 〜といったところだろう are now recognised.

## [0.2.2] — 2026-11-26 — Highlighter, connection threads, logic chart

### Added
- **Logic flow** (Breakdown, 2+ sentences): a chart of how the text's argument moves.
  A strip such as 起点 → 理由 → 例 → 結論, then each sentence as a step, with
  the connective that opens it (しかし, なぜなら, したがって…) and its function on the
  link, and the connectors inside the sentence (〜ので, 〜けど…). A blank line starts
  a new paragraph. Tap a sentence to jump to it. Toggle with **論理の流れ**.
- **Connection threads** replace the indented structure tree in each sentence card:
  phrases top to bottom, with a coloured line from each to the phrase it attaches
  to. Tap a phrase to light up its chain to the predicate and what hangs on it.
  Opening or closing them applies to every card and is remembered.
- Logic functions now have colours (shared by badges, the chart and filters).
- **Highlighter** (蛍光ペン, `highlight.html`): read a passage with four pens:
  topic/subject, predicate, connector and key point. Select words to mark them, and
  tap a mark to erase it. **Check** grades each mark against Reibun's own analysis:
  - right, close or not quite, with a reason (the particle was left off, the mark
    covers too much, this is a linked clause's predicate and not the main one…);
  - connectors are named with their logic function (cause, contrast…);
  - a list of what Reibun would also have marked.
  **Reibun's marks** shows its answer key as underlines. Key points aren't graded.
  Four sample passages (N5–N2); the passage and marks are kept on this device.

### Fixed
- A linked clause (〜と, 〜ので, 〜て…) no longer attaches to a relative clause
  inside the sentence: in 辞書を使うと、調べたい言葉…が目に入る, 使うと now links
  to 入る, not 調べたい. Sentence-opening connectors (しかし…) link to the main
  predicate.

## [0.2.1] — 2026-11-26 — Full JLPT grammar

### Added
- **Grammar** now covers the JLPT from N5 to N1: about 490 grammar points (up from
  85), from the basic particles to written N1 phrases like や否や and をもって. Each
  has an example sentence, and Breakdown finds them in your own sentences.
- New groups on the Grammar page: basic forms, particles, giving and receiving,
  time, contrast, emphasis, judgement and feeling, and formal / written style.
- **Connectives beyond the JLPT lists** (しかし, したがって, つまり, なぜなら, 例えば,
  まず…, about 50): the words that link sentences into an argument. They count
  only at the start of a sentence or clause.
- **Logic functions:** connectives and the JLPT patterns that link ideas are tagged
  with what they do in an argument: adding, contrast, concession, cause, result,
  condition, purpose, example, rephrasing, conclusion, sequence, or topic. Breakdown
  shows the function on each grammar chip and in the inspector, and the engine can
  list a text's line of reasoning sentence by sentence, ready for a paragraph chart.
- **Grammar filters:** besides the level chips, two multi-select dropdowns filter the
  Grammar page by grammar group (文法) and by logic function (論理). Choices within
  one filter widen it; filters together narrow it (N2 + 理由).
- Breakdown leaves the most basic points (は, が, を, です, ます…) out of a
  sentence's grammar chips so the interesting ones stand out. Tap a word to see
  every pattern it belongs to.

### Fixed
- Several patterns fired where they shouldn't: 〜てはいけない on 心配でならない,
  〜ようだ on 〜のような, honorific くださる on コーヒーをください, 〜たり on
  たりとも, and others.
- 〜始める／〜出す now also catches compound verbs the tokenizer keeps as one word
  (降り出す).

## [0.2.0] — 2026-11-25 — Static rewrite

Reibun is rebuilt as a static, zero-backend app in the same family as Kanji Nexus.
The Next.js prototype (hand-tagged sample phrases, Jisho proxy) is retired.

### Added
- **Breakdown** (文の分析): paste any Japanese text and see each sentence split into
  phrases (文節) with furigana, word-class colours and the role of each phrase
  (topic, subject, object, place/means, time, describes-noun, linked clause,
  predicate, agent of a passive…). Shows the sentence skeleton, a structure tree of
  what modifies what, and the grammar patterns it uses.
- **Inspector:** tap a word for its dictionary form, the role of its phrase and
  what it attaches to, the full conjugation chain (食べ + させ causative + られ
  passive + た past), grammar involving it, and a JMdict lookup.
- **Grammar** (文法): 85 grammar patterns from N5 to N3, grouped and filterable by
  level, each with an example that opens in Breakdown.
- **Library** (例文帳): save sentences with a translation and note; backup and
  restore from the Data panel.
- In-browser morphological analysis with kuromoji.js (IPADIC) in a Web Worker. The
  ~18 MB dictionary loads once and is then cached for offline use.
- Shared with Kanji Nexus: theme, header, language/theme switch, Data panel,
  installable PWA with offline support, and the JMdict dictionary pipeline.
