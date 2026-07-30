---
id: convention-every-domain-route-handler-must-call-requiresaloncontext
type: convention
scope: project
title: Every domain route handler must call requireSalonContext() — tenant scope is never taken from the request body
triggers: ["tenant scope","multi-tenant","salonId organizationId","requireSalonContext","scoping"]
anchors: [{"path":"lib/tenant.ts","symbol":"requireSalonContext"}]
asserted: 2026-07-30
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: init
---
`requireSalonContext()` (lib/tenant.ts) is the single place that resolves `{ userId, organizationId, salonId, role, permissions, impersonating }` from session + cookies (activeOrgId/activeSalonId) + DB membership — every services/*.ts function takes this ctx and filters every query by ctx.organizationId/ctx.salonId. It throws ("no pertenece a ninguna empresa" / "no tiene ningún salón asignado") if scope can't be resolved, which route handlers must let propagate (or catch and 4xx). New route handlers/services must follow this pattern; never accept organizationId/salonId from the request body or query string as the scoping value.
