# Reibun — notes for agents

Static, no-build app (vanilla ES modules in `site/`), sister to `../kanji-nexus`.
`site/js/core/` and `site/css/base.css` were copied from Kanji Nexus: when changing
shared pieces (hub, prefs, ui, icons, dict, sw.js, stamp-deploy.sh), check whether
the same change belongs in Kanji Nexus too.

- Engine (`site/js/engine/`) is pure and tested under Node with the real tokenizer:
  `go run ./tools/reibun kuromoji fetch` once, then `node --test tests/*.test.mjs`.
  Every grammar pattern needs an `ex` sentence that matches it.
- Tooling is Go (`tools/reibun`), stdlib only. Run `gofmt` and `go vet`.
- `site/js/vendor/kuromoji.js` is vendored with one patch marked `[reibun patch]`.
- Versioning: patch bump per release (0.2.1, 0.2.2, …) in `site/js/core/version.js`
  plus a `## [x.y.z]` entry in CHANGELOG.md (CI enforces). Minor bumps only when the
  user calls a milestone.
- Branches: feature → `development` (checks only) → `master` (deploys).
