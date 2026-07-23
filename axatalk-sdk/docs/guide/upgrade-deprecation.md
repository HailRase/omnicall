# Upgrade & Deprecation

## Version axes

| Axis | Policy |
| --- | --- |
| Protocol major | Wire incompat → `incompatible_version`; clients must stop |
| Package SemVer (`@axata/axatalk-sdk`) | Separate from protocol; follows npm SemVer once published |
| Additive optional fields | Compatible (ADR-0017 window) |
| Removals / renames / semantic changes | Breaking — require major |

## Consumer rules

1. Depend on documented public exports only (`etc/api/sdk.api.md`).
2. Tolerate unknown optional fields on inbound DTOs (runtime schemas strip/ignore unknowns per package rules).
3. Do not pin behavior on undocumented wire keys.
4. On `incompatible_version`: block product features; prompt upgrade.

## Deprecation window

See **ADR-0017**. Deprecated symbols receive a documented window before removal.
RC staging (SDK-10 Mode A) freezes the public API at `etc/api/sdk.api.md` (**55** symbols,
including official browser transport helpers and `OperatorStatusChangeKind`). Additive
optional options (`transportFactory?`, `scheduler?`, `jitter?`) and additive optional
protocol fields (`reservedTarget` / `reservedReasonId`) are compatible; removals remain
breaking.
No npm `latest` / stable until DI-10 closes packaged E2E gates.

## Rollback / revoke (ops)

| Event | Client behavior |
| --- | --- |
| Admin revoke | `revoked` state; clear local session UI; re-pair |
| Capability strip | `permission-changed` / subsequent `forbidden` |
| Desktop downgrade | May yield `incompatible_version` |

Package rollback, npm dist-tags, SBOM, provenance, and support policy:
see [Release, rollback, revoke & support](./release-and-support.md).
