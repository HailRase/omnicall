# Desktop SDK Integration Agent Contract

This file governs all changes made for F-011/P12 in the Axatalk Desktop repository.

## Mission

Expose a secure, typed, replaceable external integration boundary while preserving every
existing SIP-only, OCP, call, media, headset, settings, and shutdown behavior.

## Work Unit Rule

Execute exactly one work unit from [`WORK-UNITS.md`](WORK-UNITS.md) per session.
Do not start a dependent unit before an independent reviewer closes its prerequisite.

At the start:

1. Read all files listed in [`README.md`](README.md).
2. Confirm current `STATUS.md`, F-011, P12, and relevant LF entries.
3. List affected bounded contexts, layers, commands/events, and regression risks.
4. Mark one work unit `in progress`.

At the end:

1. Run the work-unit tests and proportional repository preflight.
2. Update Feature Registry, Legacy Coverage, handoff, progress evidence, and STATUS only
   when their facts changed.
3. Create the required work-history entry.
4. Request `/sdk-review`.
5. Do not continue into the next work unit.

## Architecture Boundaries

- Main owns the listening socket, connection resources, native window operations, and
  transport-level security enforcement.
- The existing renderer composition remains the single owner of Facades, Call Engine,
  SIP/OCP sessions, and Application projections.
- A narrow typed broker is the only main-to-renderer product command path.
- External commands terminate in an Application command/query handler, Facade, or Use Case.
- Call commands always pass through Call Engine.
- OCP remains optional and SIP-only mode remains fully functional.
- Stores remain projections; neither stores nor React components receive gateway commands.
- Domain never imports WebSocket, Electron, IPC, protocol schemas, or SDK packages.
- Adapters do not leak library objects across ports.
- No `window.Softphone`, DOM CustomEvent host bus, or global socket is allowed.

## Protocol Boundaries

- Shared wire DTOs belong to the public protocol package/fixtures, not Domain.
- Every WS and IPC payload is `unknown` before validation.
- Desktop maps internal events and projections to explicit public DTOs.
- Internal correlation IDs may be included only when approved and safe.
- Branded IDs become documented opaque strings at the public boundary.
- Raw exceptions, SIP reasons, OCP messages, secrets, and UI state never cross the boundary.

## Security Boundaries

- Bind only to approved loopback addresses.
- Validate exact Origin during upgrade and capability on every command.
- Pairing and client authorization fail closed.
- No common bearer secret embedded in web applications.
- Per-client subscriptions replace broadcast.
- Enforce frame, depth, connection, rate, timeout, and queue limits.
- Serialize mutations per aggregate and prevent replay.
- Logs use allowlisted fields and never include payloads or PII.
- External OCP endpoint selection must not enable SSRF.

## Change Safety

- Do not move the entire telephony composition to main within P12.
- Do not add SDK methods directly to renderer hooks.
- Do not enlarge `AccountBootstrapFacade` when a focused external Application service can
  delegate to existing public methods or Use Cases.
- Do not change existing OCP host behavior silently; add a mapper and compatibility tests.
- Do not add raw credential sign-in to protocol v1.
- Do not implement hide before tray/background and active-call policies are approved.
- Do not modify transfer backlog behavior.

## Testing Rules

Use [`TEST-MATRIX.md`](TEST-MATRIX.md). Critical changes require:

- contract parser tests;
- broker request/reply/timeout/teardown tests;
- router-to-Use-Case mapping tests;
- gateway security and resource-limit tests;
- event mapper privacy tests;
- SIP-only and OCP optional regression tests;
- multi-tab race tests;
- packaged Electron end-to-end evidence before release.

## Stop Conditions

Stop and report a blocker if:

- an ADR-required decision is missing;
- implementation would create a second Application composition;
- a command cannot map to an existing use case safely;
- a secret or unauthorized PII would cross WS, IPC, projection, or logs;
- tests require weakening Electron sandbox or preload boundaries;
- an SDK request conflicts with active-session, OCP recovery, or Call Engine invariants.
