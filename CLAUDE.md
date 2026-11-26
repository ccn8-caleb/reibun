# Reibun — notes for agents

Static, no-build app (vanilla ES modules in `site/`), sister to `../kanji-nexus`.
`site/js/core/` and `site/css/base.css` were copied from Kanji Nexus: when changing
shared pieces (hub, prefs, ui, icons, dict, sw.js, stamp-deploy.sh), check whether
the same change belongs in Kanji Nexus too.

- Engine (`site/js/engine/`) is pure and tested under Node with the real tokenizer:
  `go run ./tools/reibun kuromoji fetch` once, then `node --test tests/*.test.mjs`.
  Every grammar pattern needs an `ex` sentence that matches it.
- Grammar catalog: `site/js/engine/grammar/n5.js` … `n1.js` (one file per JLPT level).
  IPADIC tokenizes unpredictably (compound verbs are often one token; set phrases split
  oddly), so check real tokens before writing steps, and prefer `T('phrase')` for fixed
  phrases. Mark a pattern `generic` when a longer one contains it, `quiet` when it's too
  basic for Breakdown's chips. Logic functions (cause, contrast…) for JLPT patterns
  live in `grammar/logic.js`; connectives carry theirs inline and use `initial`.
  After changes, run unrelated sentences through the matcher and look for false
  positives, not just the examples.
- Tooling is Go (`tools/reibun`), stdlib only. Run `gofmt` and `go vet`. Exception:
  `tools/bank/build.mjs` is Node because it needs the JS matcher; `reibun tatoeba build`
  runs it. Rebuild the bank (site/data/bank) after matcher changes if the bank test fails.
- `site/js/vendor/kuromoji.js` is vendored with one patch marked `[reibun patch]`.
- Versioning: patch bump per release (0.2.1, 0.2.2, …) in `site/js/core/version.js`
  plus a `## [x.y.z]` entry in CHANGELOG.md (CI enforces). Minor bumps only when the
  user calls a milestone.
- Branches: feature → `development` (checks only) → `master` (deploys).
