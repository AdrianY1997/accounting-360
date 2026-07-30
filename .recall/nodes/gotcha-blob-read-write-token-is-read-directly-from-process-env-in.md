---
id: gotcha-blob-read-write-token-is-read-directly-from-process-env-in
type: gotcha
scope: project
title: BLOB_READ_WRITE_TOKEN is read directly from process.env in route handlers, bypassing the validated lib/env.ts schema
triggers: ["vercel blob","env vars","variables de entorno","BLOB_READ_WRITE_TOKEN","image upload"]
anchors: [{"path":"app/api/salon-settings/logo/route.ts"},{"path":"lib/env.ts","symbol":"env"}]
asserted: 2026-07-30
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: init
---
`lib/env.ts` zod-validates DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_WHATSAPP_FALLBACK and the project convention (per its own comment) is "import env instead of reading process.env directly so missing/invalid vars fail fast at boot." BLOB_READ_WRITE_TOKEN (used by @vercel/blob for catalog/logo image uploads) does NOT go through lib/env.ts — it's read ad hoc via `process.env.BLOB_READ_WRITE_TOKEN` in app/api/salon-settings/logo/route.ts, app/api/services/[id]/images/route.ts and app/api/service-images/[id]/route.ts, each with its own manual "not configured" 500 check. It won't fail fast at boot if missing; it fails per-request when someone tries to upload.
