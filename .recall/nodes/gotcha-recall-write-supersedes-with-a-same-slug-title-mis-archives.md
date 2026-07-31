---
id: gotcha-recall-write-supersedes-with-a-same-slug-title-mis-archives
type: gotcha
scope: project
title: recall write --supersedes with a same-slug title mis-archives the new content — always query/verify after an approved supersede
triggers: ["supersedes","recall write","audit proposal","recall restore"]
anchors: [{"path":"E:/Trabajo/recall/bin/recall.js"}]
asserted: 2026-07-31
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: manual
---
Twice in one session, approving an audit's proposed `recall write --supersedes
<id> --approved` where the new `--title` hashes to the SAME slug as the node
being superseded resulted in the node being archived with `superseded_by`
pointing at itself — the corrected content landed in `.recall/archive/`,
flagged `invalidated`, and vanished from `recall query` entirely, instead of
replacing the live node in `.recall/nodes/`.

Fix: `node recall.js restore <id>` — the archived file's body already has the
correct/final content, only its frontmatter (`invalidated`, `superseded_by`)
is wrong; restoring clears that and moves it back to `nodes/`. Then
`recall reindex` and `recall query "<a trigger word>"` to confirm it's live
again.

Always run a `query` for the memory's own trigger words right after approving
any `--supersedes` write — don't just trust the CLI's "updated X" success
message, it prints that even when this collision happens.
