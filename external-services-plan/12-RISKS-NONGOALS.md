# F-031 Risks and Non-goals

- Purpose: make accepted trade-offs, mitigations, and excluded scope explicit.
- Inputs: locked v1 product decisions, architecture discovery, and security constraints.
- Outputs: implementation guardrails and review criteria.

## Risks and chosen mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| HTTP latency/failure reaches call path | Critical telephony degradation | Non-async post-commit subscriber, isolated FIFO queue, no Call Engine dependency, unresolved-HTTP integration test |
| Arbitrary URL accesses private services | Local SSRF capability | Accepted v1 requirement; authenticated local config, protocol allowlist, strict size/time/concurrency bounds, visible journal |
| User stores credentials in headers/query | Config/export leakage | Explicit UI/export disclosure, protected-header journal masking, no logs/bodies/headers, no SDK exposure |
| Large responses consume memory/disk | Crash or storage growth | Main response cap, 16 KiB journal cap, 100-entry profile cap |
| Huge number of definitions floods queue | Resource pressure | Concurrency three, in-memory FIFO, start-time invalidation, optional non-blocking UI warning; no hard product count |
| Profile switch leaks requests/history | Cross-account exposure | Generation/profile capture, pending cancellation, old in-flight old-bucket completion, A/B tests |
| Renderer focus updates race events | Wrong-line fire | Application-owned focus projection subscribed before matcher; focus snapshot at event time |
| Re-invite/hold looks like new call | Duplicate automation | Map only explicit initial call facts; per-call emitted-code tracker tests |
| Campaign accept/reject lacks full payload | Missing variables | Cache typed `OperatorCampaignOffered` by campaign ID and join clear reason |
| ACD typed event carries wire IDs | Privacy expansion | Expose only queue/phase/event safe subset; tests prove wire IDs absent |
| F-030 secret-free wording becomes inaccurate | User misunderstands exports | Document that user-authored External Services values are portable while SIP/OCP/SDK secrets remain excluded |
| Journal write fails after successful HTTP | Misclassified result | Return/classify transport independently; structured journal failure log |
| Main/preload contract broadens attack surface | Renderer privilege escalation | Narrow typed validated IPC, no raw IPC/path/Node exposure, disposer and byte limits |
| Settings schema downgrade | Older app rejects profile | Standard fail-closed v12 behavior and migration docs; no silent downgrade |
| UI scope becomes Postman clone | Delay/maintenance burden | Adopt Postman-like **layout skeleton** only (sidebar tree + URL bar + tabs + Response/History); keep flat focused v1 editor, existing UI Kit; no scripts/auth/chaining/nested folders |

## Explicit non-goals

- Inbound HTTP server or control API.
- F-011 OmniCall Kit protocol/capability changes.
- F-028 OCP authentication, status, or wire changes.
- Prebuilt Bitrix24 or vendor-specific connectors.
- Postman collection v2.1 compatibility.
- Pre-request/test scripts, conditions, loops, chaining, environments, or response variables.
- Response-driven call, OCP, SDK, headset, window, or navigation control.
- Cloud sync or shared-team collections.
- Nested folders or hard definition count limit.
- Retry, backoff, durable queue, offline replay, or catch-up after restart.
- HMAC signing, OAuth/Auth tabs, credential manager, or secrets vault.
- SSRF denylist, private-IP block, DNS pinning, TLS pinning, or insecure-HTTP warning.
- Full PII masking.
- Hold, mute, SIP registration, OCP login/logout/status, SDK pairing, or dedicated transfer triggers.
- Transfer R6 backlog work.
- Journal rerun, delete/clear, search/filter, pagination, or export unless separately approved.

## Deferred decisions requiring new scope

- Secrets vault or encrypted External Services credentials.
- HMAC/request signing.
- Durable/retry delivery guarantees.
- Organization-managed policy/allowlist.
- Postman import compatibility.
- Full PII redaction policy.
- Per-request timeout/concurrency/redirect configuration.
- Campaign-to-call association if a future typed F-028 event exposes it.
- Attaching last-call party variables to `post_call_processing` (operator-level edge today).
- Further automatic trigger codes or variables beyond the current eleven.

## Review stop conditions

Stop and request a new product/ADR decision if implementation would require:

- Awaiting or injecting F-031 into Call Engine/telephony Use Cases.
- Renderer fetch or raw IPC.
- New OCP wire fields or SDK public capabilities.
- Exporting existing SIP/OCP/SDK secrets.
- A response command bridge.
- A generic UI primitive duplicated locally.
- Relaxing TypeScript, i18n, file-budget, validation, or logging rules.
