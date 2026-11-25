# Changelog

Versions follow [semver](https://semver.org/). The version lives in
`site/js/core/version.js`; every release needs an entry here (CI checks it). Each
deploy also carries a build id (commit hash), shown next to the version in the app.

**Numbering (from 0.2.0):** every release bumps the patch number (0.2.1, 0.2.2, …,
0.2.15 is fine). The minor number only moves for a milestone called out on purpose.

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
