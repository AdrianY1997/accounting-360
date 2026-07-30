---
id: gotcha-access-control-is-fully-custom-per-member-permissions-not
type: gotcha
scope: project
title: Access control is fully custom per-member permissions, not a fixed owner/admin/manager/cashier/staff role matrix
triggers: ["roles","permisos","can()","role matrix","manager cashier","member_permission"]
anchors: [{"path":"lib/roles.ts","symbol":"ROLES"},{"path":"db/schema/access.ts","symbol":"memberPermission"},{"path":"lib/tenant.ts","symbol":"requireSalonContext"}]
asserted: 2026-07-30
invalidated: null
superseded_by: null
confidence: medium
pin: false
source: init
---
`lib/roles.ts` ROLES is only `["owner", "staff"]` (isAdmin checks `["owner","admin"]` as a legacy carry-over but no UI creates "admin" members anymore). There is NO fixed role→permission matrix. Every non-owner member gets an explicit, fully custom set of `Permission` strings stored in `member_permission` (migration 0013, one row per (member, permission)); owners implicitly get all permissions. `can(ctx: {role, permissions}, permission)` checks `ctx.permissions` for non-owners. `requireSalonContext()` (lib/tenant.ts) loads the member's permissions into `SalonContext.permissions`. Replaced an earlier fixed-role model via commit 4ec7bf2 "feat: fully custom per-user permissions" (after fbf5938 "fine-grained role permissions"). Staff create/edit UI (`StaffFormDialog`/`StaffEditDialog`) uses permission checkboxes (`ALL_PERMISSIONS` + `permissionLabels`), not a role select.
