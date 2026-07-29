# F-031 Security and Isolation

- Purpose: constrain arbitrary outbound HTTP while preserving telephony reliability and local integrator use cases.
- Inputs: user-authored URLs/headers/bodies, typed events, IPC payloads, transport responses, and logs.
- Outputs: validated bounded requests, redacted evidence, and zero response-to-product control paths.

## Call-path isolation checklist

- [ ] No F-031 dependency is injected into Call Engine or telephony Use Cases.
- [ ] Existing event publication does not await matcher, queue, HTTP, journal, or UI.
- [ ] Subscriber callback performs bounded in-memory normalization/enqueue only.
- [ ] Queue and transport failures are caught outside call execution.
- [ ] Disabled/unconfigured mode is inert and SIP-only bootstrap remains valid.
- [ ] Response types expose no command, facade, Call Engine, OCP, headset, or SDK callback.
- [ ] Profile lifecycle invalidates pending jobs without delaying logout.
- [ ] Integration tests prove unresolved HTTP does not delay event publication/answer/hangup paths.

## Trust boundaries

- Settings/import files enter as `unknown` and are parsed before Domain use.
- Renderer calls Application facade methods only.
- Application calls `OutboundHttpPort`; no renderer component calls fetch or preload.
- Preload exposes narrow validated methods, never raw `ipcRenderer`.
- Main validates IPC again before network access.
- HTTP response bytes are untrusted and bounded before decoding/persistence/display.
- Journal adapters validate persisted documents before returning records.

## Network policy v1

- Allow only `http:` and `https:`.
- Deliberately allow localhost, loopback, LAN, link-local, and private IP ranges.
- No SSRF denylist, DNS rebinding defense, HMAC signing, TLS pinning, or insecure-HTTP warning.
- Bound redirects, URL/header/body sizes, response bytes, duration, and concurrency.
- Never inherit browser cookies, renderer credentials, OCP auth, SIP auth, SDK pairings, proxy auth, or ambient application headers.
- Transport follows user-authored redirect behavior only as fixed in ADR-0022; protected headers must not be forwarded cross-origin unless the ADR explicitly permits it. Recommended: strip `Authorization`, `Cookie`, and `X-Api-Key` on origin change.

## Sensitive values

- Product explicitly stores tokens as ordinary header/query values; there is no External Services vault in v1.
- Settings and F-030 collection export may therefore contain those user-authored values; UI copy must state that exported files can contain integration credentials.
- Do not label F-030 as secret-free for External Services without this qualification; existing SIP/OCP/SDK secret exclusions remain true.
- Never copy External Services values into OS logs, error telemetry, notification text, window titles, or SDK snapshots.
- Do not expose config/journal through F-011 capabilities.

## Header redaction

Before journal persistence or UI projection, compare trimmed header names case-insensitively against:

```txt
authorization
cookie
x-api-key
```

- Replace each matching value with exact `***`.
- Preserve header name/order for diagnostics.
- Apply redaction after template resolution so generated values are protected.
- Apply the same redactor to request logs/debug diagnostics; preferred logs omit all headers.
- Tests cover casing, whitespace, duplicates, disabled rows, and near matches such as `Authorization-Info` remaining governed by explicit policy.

## Body and error handling

- Truncate response body to 16 KiB before journal/UI storage.
- Main transport cap prevents unbounded memory before journal truncation.
- Normalize decode failures without dumping raw bytes.
- Error messages shown to users must not include request headers/query values or full OS socket diagnostics that may echo URLs.
- Structured logs carry stable category/code, not raw request/response content.
- UI renders body as text; never inject HTML or execute scripts.

## Response non-interference

Forbidden dependencies:

```txt
ExternalServicesExecutionResult → Call Engine
ExternalServicesExecutionResult → telephony Use Case
ExternalServicesExecutionResult → OCP command
ExternalServicesExecutionResult → SDK command router
ExternalServicesExecutionResult → renderer navigation outside F-031
```

No response parser, business-success expression, callback script, command mapping, or global event emission is introduced.

## Threat notes and accepted residual risk

| Risk | v1 position | Mitigation |
| --- | --- | --- |
| SSRF to local/private services | Accepted product requirement | Authenticated local user configuration, protocol allowlist, bounded resources, journal visibility |
| Plain HTTP credential exposure | Accepted; no warning banner | User ownership, explicit docs, no ambient credentials |
| Config/export credential leakage | Accepted because values are ordinary fields | UI/export disclosure, journal/log redaction, no automatic sharing |
| Response memory exhaustion | Not accepted | Main response cap and 16 KiB persistence cap |
| Queue overload | Controlled | Concurrency 3, in-memory FIFO, lifecycle invalidation; soft UI warning may be added without blocking |
| Malicious import | Not accepted | Size cap, unknown validation, version gate, no scripts |
| Call-path latency | Not accepted | Non-async subscriber and isolated queue |

## ADR-0022 required decisions

- Main-process HTTP ownership and typed IPC shape.
- Redirect count and protected-header cross-origin behavior.
- Request/response size limits.
- Post-commit subscriber ordering and non-await guarantee.
- Application-owned focused-call projection.
- Profile switch/logout pending versus in-flight policy.
- Explicit acceptance of localhost/private destinations and no SSRF denylist.

## Security tests

- Protocol/URL/IPC malformed payload rejection.
- Local/private destinations remain allowed by policy.
- Timeout/abort and resource cleanup.
- Protected-header journal masking and no raw values in captured logs.
- Response body cap/truncation and text-only rendering.
- F-011 snapshots/events never contain F-031 config/journal.
- Mock response cannot invoke facade/call/OCP/SDK methods.
