# ADR-0022: External Services HTTP isolation and non-blocking dispatch

- Status: **Accepted**
- Date: 2026-07-29
- Deciders: Softphone platform
- Related: F-031; F-016/F-023/F-030 (Settings/profile/portability); consume-only F-028 facts; non-overlap F-011

## Context

F-031 adds profile-scoped outbound HTTP automations (webhooks) driven by focused-call and
selected campaign/ACD Domain facts plus manual Run now. Arbitrary user URLs must not run
through renderer `fetch` (CORS, ambient credentials, expanded trust boundary). Trigger
handling must never block Domain event publication, Call Engine, OCP, SDK, or telephony
Use Cases. Cross-process ownership, focus projection, queue concurrency, redirects, size
limits, and profile lifecycle policy need one recorded decision before runtime code.

Affected: Integration (primary), Settings (persistence); layers Application / Ports /
Adapters / Infrastructure / Electron main; no Domain technology imports.

## Decision

### 1. Main-process HTTP behind `OutboundHttpPort` and typed IPC

- Application calls `OutboundHttpPort` only; UI never calls `fetch`, Node HTTP, or raw IPC.
- Real adapter: preload narrow method → typed IPC contract → Electron main HTTP handler.
- Main validates again: `http:`/`https:` only, timeout, size bounds, abort cleanup.
- Port returns transport facts only; 2xx success classification stays in Domain/Application.
- Rejected: renderer `fetch` (unlike controlled OCP/update adapters); HTTP inside Call Engine
  or telephony Use Cases.

### 2. Non-async post-commit subscriber; queue concurrency three

- Binder registers after facade commits projections to the store (post-commit ordering).
- Subscriber callbacks are **not** `async`; they normalize, match, enqueue, and return.
- Queue is in-memory FIFO; `EXTERNAL_SERVICES_MAX_CONCURRENCY = 3`; no retries/offline replay.
- Publisher paths never await matcher, queue, HTTP, journal, or UI.

### 3. Application-owned focus projection

- Focus eligibility is read from a typed Application snapshot at event evaluation time.
- Every call-related automatic trigger (including ringing) fires only when its call is focused.
- Domain stays free of React/Zustand; store remains projection-only.

### 4. Profile pending cancellation vs in-flight completion

- Profile switch/logout: increment lifecycle generation; drop pending old-generation jobs.
- Do not abort already in-flight jobs solely for switch/logout; they finish and journal to
  the captured old profile bucket.
- App shutdown may abort transport; classify `aborted` when journal storage remains available.

### 5. Local/private URL allowance and security bounds

- Localhost, LAN, link-local, and private IPs are **allowed** (product requirement).
- No v1 SSRF denylist, DNS-rebinding defense, TLS pinning, or insecure-HTTP warning.
- Never inherit browser cookies, renderer/OCP/SIP/SDK credentials, or ambient app headers.
- Residual SSRF risk accepted for authenticated local operators; mitigate with protocol
  allowlist, resource bounds, journal visibility, and no response-to-command path.

### 6. Redirect, protected headers, and byte limits

| Limit | v1 value |
| --- | --- |
| Redirects | Follow up to **5**; reapply timeout and response limits each hop |
| Protected headers on origin change | Strip `Authorization`, `Cookie`, `X-Api-Key` (case-insensitive) |
| Request timeout | **10_000** ms fixed |
| Transport response cap | **1 MiB** hard read cap before journal/UI truncation |
| Journal/UI body | **16 KiB** UTF-16-safe truncate |
| Journal depth | Latest **100** completed attempts per profile |

- Journal redacts the same protected header names to `***` before persistence/display.
- Responses are observation-only; no facade/Call Engine/OCP/SDK/navigation commands.

## Alternatives Considered

| Alternative | Benefit | Risk | Rejected because |
| --- | --- | --- | --- |
| Renderer `fetch` | Less IPC | CORS; ambient credentials; UI network trust | Arbitrary user URLs |
| Await HTTP in Use Cases | Simpler sync mental model | Call-path latency/failure coupling | Telephony reliability law |
| Independent config repository | Isolation from settings | Duplicates profile atomicity / F-030 | Settings aggregate already owns persistence |
| SSRF denylist | Safer defaults | Blocks local integrators; product forbids v1 | Explicit product allowance |
| Response command router | Webhook-driven call control | Violates observation-only law | Non-goal |

## Consequences

- Positive: HTTP outside renderer; call path stays non-blocking; replaceable transport via port.
- Trade-offs: localhost/private SSRF residual risk; plain-HTTP credentials accepted without warning.
- Testing: non-blocking event path, concurrency 3, redirect/header strip, size caps, focus gate,
  profile lifecycle, Domain dependency boundary.
- Observability: structured logs with F-031 correlation fields; never log URLs/headers/bodies/tokens.
- Migration: `UserSettings` schema v11→v12 empty default (WU-01); no LF parity.
- Rollback: disable feature / empty settings leave SIP-only bootstrap intact.
- Acceptance gate: accepted at the WU-02 port freeze; WU-04 main HTTP/IPC matches redirect≤5, protected-header strip on origin change, 10s timeout, and 1 MiB transport / 16 KiB journal caps.

## Architecture Checks

- Domain remains framework-independent (no Electron/Node/browser/React/Zustand/storage).
- UI does not access adapters or raw IPC.
- External HTTP library/facility remains replaceable behind the port.
- State transitions remain explicit Domain events; F-031 is an optional consumer.
- Critical flows remain observable without leaking secrets.
- F-011 and F-028 contracts unchanged; SIP-only bootstrap preserved.

## Related Links

- Feature Registry: F-031
- Plan: `external-services-plan/`
- Handoff: `docs/softphone/handoffs/P14-External-Services-Master-Handoff.md`
- Security notes: `external-services-plan/07-SECURITY-ISOLATION.md`
- Supersedes: —
- Superseded By: —
