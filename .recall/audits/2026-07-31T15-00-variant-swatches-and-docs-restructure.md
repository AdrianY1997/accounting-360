# Audit — 2026-07-31T15:00 — variant picker photo swatches + AGENTS.md/README.md docs restructure

## Scope

Two bundled changes, both already committed on `main`:

1. `7d23573` — docs: replace `docs/` with recall as the AI-facing documentation
   system (`AGENTS.md`, `README.md`, deletion of `docs/*`).
2. `efc8338` — feat: variant picker as photo swatches for non-technical
   shoppers (`components/store/variant-picker.tsx`,
   `components/store/product-detail.tsx`).

Also present in `git status` but out of scope per task instructions (not part
of either described change, not touched): `.gitignore`, `.recall/INDEX.md`,
`.recall/journal.jsonl`, `app/print/sales/[id]/page.tsx`.

## Inputs gathered

- `git --no-pager diff --stat` / `git --no-pager diff` (working tree — showed
  only the out-of-scope files above; the two target changes were already
  committed, so reviewed via `git show 7d23573` / `git show efc8338`).
- `node recall.js pending --json` — confirmed the touched-file ledger:
  `AGENTS.md`, `README.md`, `components/store/variant-picker.tsx`,
  `components/store/product-detail.tsx`.
- `node recall.js query "variant picker store product detail images"` — no
  standing convention specific to swatches; surfaced the catalog-pricing and
  BLOB-token gotchas (not applicable here).
- `node recall.js recurring --min 2` — empty (only 1 prior audit exists), so
  no standing repeat-offence category to check against.
- Read `components/store/product-gallery.tsx`, `components/store/product-card.tsx`,
  `lib/ai-images.ts`, `services/public.ts` for cross-file consistency.
- `grep -r "docs/(api|architecture|...)"` across the whole repo (not just
  `*.md`) to confirm no dangling references survived the docs/ removal.

## Findings

### 1. `components/store/variant-picker.tsx:53,66-74` — 🟡 risk: AI-image disclosure dropped for variant swatches

`lib/ai-images.ts` documents `aiKindDisclosures` as shared by "the admin
uploader and the public store badges/tooltips" — every other customer-facing
photo render honors it:

- `product-gallery.tsx:50-54` (main image) and `:88-92` (thumbnail strip) both
  render `aiKindDisclosures[...]` via a badge/tooltip when `aiKind` is set.
- `product-card.tsx:51` renders `aiKindDisclosures[item.coverAiKind]`.

`variant-picker.tsx:53` takes `const photo = v.images[0]?.url` and never reads
`v.images[0]?.aiKind`, even though `PublicVariantImage` carries it
(`services/public.ts:19-24`). The result: an AI-generated/reference variant
photo shows the "IA" disclosure in the gallery but the *same photo*, rendered
as a swatch a few pixels away, carries no disclosure at all. This is an
inconsistency in a spot literally designed to make photos more prominent for
non-technical shoppers — the disclosure should be at least as visible there,
not less.

### 2. `components/store/variant-picker.tsx:56-99` — 🟡 convention: photo-tile markup duplicated instead of reusing/extracting a component

AGENTS.md's componentization rule requires checking `components/` for an
existing fit before adding new markup. The new swatch button
(`w-20` flex column, `size-16 overflow-hidden rounded-md border` image box,
absolute `Agotado` ribbon on sold-out, `isNew()` badge) is a near line-for-line
copy of the thumbnail button already in `product-gallery.tsx:68-101`, which is
itself a close cousin of the tile in `product-card.tsx`. This is now the third
independent implementation of the same "photo tile" concept in this directory,
and they've already drifted (different ribbon font sizes, different "Nuevo"
badge shapes/positions). None of the three was checked against the others
before being extended — a shared `PhotoTile`/`Swatch` component would have
made finding #1 impossible to miss (the AI-disclosure prop would be part of
its signature).

## What I did not flag

- `product-detail.tsx:311-324` (the conditional hint label) — logic is
  correct and matches the stated intent (hint only when `variants.length > 1`,
  matching `VariantPicker`'s own `> 1` gate for the "Todas" tile). Spanish
  phrasing ("Toca una tarifa para ver...") is mildly awkward but doesn't
  change meaning — a formatting nit, not raised per instructions.
- Accessibility of the swatch buttons (`alt=""` + visible name below) —
  consistent with the existing gallery thumbnail pattern, not a regression.
- Test coverage — the repo has no test infrastructure at all (`find
  *.test.*` = empty), so "no test for new component" isn't an actionable,
  project-specific finding.
- The docs restructuring itself (`AGENTS.md`/`README.md`) — diff is clean;
  verified no dangling `docs/api.md` etc. references survive anywhere in the
  repo (grepped the whole tree, not just markdown). No findings.
- `.gitignore`, `.recall/INDEX.md`, `.recall/journal.jsonl`,
  `app/print/sales/[id]/page.tsx` — out of the stated scope, not reviewed.

## Memories written

- `gotcha-store-photo-thumbnail-swatch-markup-border-2-size-16-agotado` — the
  three-way markup duplication, with a pointer to extract a shared component.
- `convention-every-store-facing-photo-tile-must-show-the-aikind` — the
  disclosure-must-propagate rule, anchored to `lib/ai-images.ts#aiKindDisclosures`.

Both are auto-writable types (`gotcha`, `convention`); no approval-gated
proposals were needed for this audit.
