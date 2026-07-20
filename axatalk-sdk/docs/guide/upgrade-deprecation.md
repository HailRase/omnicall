# Upgrade & Deprecation

## Version axes

| Axis | Policy |
| --- | --- |
| Protocol major | Wire incompat → `incompatible_version`; clients must stop |
| Package SemVer (`@axatalk/sdk`) | Separate from protocol; follows npm SemVer once published |
| Additive optional fields | Compatible (ADR-0017 window) |
| Removals / renames / semantic changes | Breaking — require major |

## Consumer rules

1. Depend on documented public exports only (`etc/api/sdk.api.md`).
2. Tolerate unknown optional fields on inbound DTOs (runtime schemas strip/ignore unknowns per package rules).
3. Do not pin behavior on undocumented wire keys.
4. On `incompatible_version`: block product features; prompt upgrade.

## Deprecation window

See **ADR-0017**. Deprecated symbols receive a documented window before removal.
This incubation build has **no npm stable** yet — treat the API report as the freeze line
for SDK-09 docs.

## Rollback / revoke (ops)

| Event | Client behavior |
| --- | --- |
| Admin revoke | `revoked` state; clear local session UI; re-pair |
| Capability strip | `permission-changed` / subsequent `forbidden` |
| Desktop downgrade | May yield `incompatible_version` |

Rollback of a published package is an SDK-10 / release concern — not claimed here.
