# ADR-0012: SDK Protocol Versioning, Compatibility, Privacy, and Call Ownership

## Type

DOCUMENT.

## Status

Accepted (2026-07-20) — open precision items **closed by SDK-01** (ADR-0014/0017, 2026-07-20)

## Context

- **Features:** F-011; OCP surface baseline F-028 E-12
- **Legacy:** LF-051, LF-065, LF-080, LF-081
- **Roadmap:** P12
- **Contexts:** Integration, Telephony, Operator
- **Layers:** Public protocol package, Application mappers, Ports

Public protocol v1 must be versioned independently from npm and desktop SemVer, must not
leak Domain/JsSIP/OCP wire/React/store objects, and must define ownership rules so multiple
browser tabs cannot corrupt call state.

## Decision

1. **Protocol identity:** Protocol version is independent from `@softomnitel/omnicall-kit` and OmniCall
   Desktop package versions. Handshake negotiates min/max protocol, SDK version, desktop
   version, capabilities, server instance ID, session epoch, and snapshot revision.

2. **Compatibility policy:**
   - Additive optional fields / ignorable new commands or events = compatible.
   - Remove/rename/type/semantics change = breaking → new protocol major + migration window.
   - Desktop supports documented **current and previous** protocol majors during migration.
   - Incompatible clients receive `incompatible_version` **before** any product state/PII.
   - Golden fixtures are shared and tested in both `omnicall-kit` and desktop (SDK-02 / DI-01).

3. **DTO boundary:** Public commands, replies, events, and snapshots are discriminated
   unions of JSON-safe DTOs. Machine-readable error codes only (see PROTOCOL.md). Localized
   UI strings are never transported. Internal Domain Events are mapped, never forwarded.

4. **Privacy baseline:**
   - Phone numbers and display names are masked unless a specific capability grants them.
   - Events are **per authorized session**, never indiscriminate broadcast.
   - Contacts, call history, raw SIP URIs, OCP wire IDs, and upstream error text are
     **excluded from protocol v1** unless a later ADR/capability approves them.
   - Unauthorized snapshot sections are **omitted**, not filled with fake sensitive values.
   - OCP-disabled snapshots contain no fabricated OCP state.

5. **Call ownership / aggregate safety (principles closed):**
   - Mutations serialize per call or account aggregate.
   - Destructive/control commands require ownership or lease check and expected revision
     where applicable; conflicts return `conflict`, `stale_state`, or `not_owner`.
   - Prefer scoping `call.control` to calls originated by that client when practical;
     answering inbound may use a documented exception with capability `call.control`.
   - Duplicate request IDs are idempotent or rejected as specified by protocol fixtures —
     never silently applied twice.
   - Client disconnect / timeout does **not** auto-replay mutations.

6. **OCP naming:** Public operator DTOs are protocol-owned. F-028 E-12
   `OcpHostApiContract` remains an **internal** host-command baseline; DI-07 maps public
   protocol ↔ existing Facade methods with `callType: "sdk"`. No OCP wire objects cross WS.

7. **Campaign events:** `operator:campaign-offered` / `operator:campaign-cleared` stay
   listed in PROTOCOL.md but enter v1 only after privacy review (open item below).

## Open Decisions

**Closed by SDK-01** — see **ADR-0014** (schema) and **ADR-0017** (PII/ownership/campaign/OCP/deprecation).

| ID | Resolution |
| --- | --- |
| O-SCHEMA-1 | Zod schemas → inferred types; fixture layout in ADR-0014 |
| O-PII-1 | Single v1 level `session.read.redacted` with mask formats in ADR-0017 |
| O-OWN-1 | Owner = originate/answer client; `expectedRevision`; no steal in v1 |
| O-CAMP-1 | Campaign events deferred past protocol v1 |
| O-OCP-1 | Public ↔ E-12 map table in ADR-0017; no `ocp:*` / secrets on public WS |

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Expose Domain Events directly | Couples CRM to internal model; leaks PII |
| Single global “current call” without ownership | Multi-tab races |
| Tie protocol version to desktop SemVer | Forces CRM upgrades on unrelated desktop patches |

## Consequences

- SDK-01 closed open rows (ADR-0014/0017); SDK-02 may implement schemas against them.
- DI-01 consumes fixtures without inventing redaction/ownership rules.
- Compatibility matrix in `TEST-MATRIX.md` is mandatory for DI-10.

## Architecture Checks

- Domain free of protocol package imports.
- Application mappers own public DTO projection.
- Error codes remain stable across additive releases.

## Related Links

- Feature Registry: F-011, F-028 (E-12 baseline)
- `omnicall-kit/docs/PROTOCOL.md`
- `omnicall-kit/docs/SECURITY.md`
- Related: ADR-0009, ADR-0011, ADR-0013
