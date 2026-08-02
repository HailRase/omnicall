# WU-00 Verified Findings (2026-08-02)

- Purpose: record audit claims verified against current code (not assumed).
- Inputs: desktop `src/application/integration`, `src/adapters/integration`, `src/main/sdk`, `omnicall-kit` packages/docs.
- Outputs: confirmed / nuanced / root-cause rows with file evidence.

## Confirmed

| # | Finding | Evidence |
| --- | --- | --- |
| 1 | Product vs window different revision clocks | `SdkSessionRevisionClock` in `bindSdkBrokerSession.ts`; separate `revision` in `sdkGatewayWindowHandler.ts` |
| 2 | Product replies post-mutation revision; window replies pre-mutation | Call/account/operator use `revisionClock.advance()` then reply; window `show`/`hide` capture `revision` then `+= 1` and return old value |
| 3 | `getRevision()` reads only cached snapshot revision | `snapshot-cache.ts` `getRevision` → `current?.revision`; orchestrator exposes cache only |
| 4 | Successful replies/events do not update SDK latest-known revision | `product-orchestrator.ts` updates cache on snapshot inbound only; replies return revision to caller but do not write tracker |
| 5 | No single aggregate serialization for all revision mutations | `SdkAggregateMutex` per callId / `__sdk_account__`; window path outside that mutex; SECURITY.md states per-call/account only |
| 6 | Request dedup global across WS clients | One `SdkRequestDedupCache` on `LocalWsSessionRegistry`; keyed by `requestId` only |
| 7 | Pending dedup not abandoned/expired correctly | `abandon()` defined but never called; `prune()` deletes only `kind === "done"` |
| 8 | Pairing storage keyed by `clientId` | `clientSecretId(clientId)`; `get`/`save`/`revoke` by clientId; `findActive` checks origin after load |
| 9 | Release docs contradict published/workspace state | `packages/sdk` **0.1.4**; RELEASE-PLAYBOOK / many guides / STATUS claim **0.1.0** `latest`; example pins `0.1.0` |
| 10 | Public SDK ergonomics gaps | Cache-only `getRevision`; no authoritative latest-known helper; dual-clock surprises for CRM `expectedRevision` chains |
| 11 | Preflight / sdk-09 example smoke fails (8 pass, 1 fail) | See root cause below |

## Nuanced

| Topic | Note |
| --- | --- |
| Pairing Origin check | `findActive(clientId, origin)` rejects origin mismatch, but **storage identity** remains clientId-only (overwrite / collision risk across Origins) |
| Per-call mutex | Exists for same-call races; does **not** replace aggregate revision serialization across window/operator/call |
| F-011 status | P12 DI-00…DI-11 remain `done`; this track is **corrective**, not a claim that P12 never shipped |

## Finding 11 — sdk-09 root cause (do not weaken assertions)

**Test:** `omnicall-kit/packages/sdk/src/docs/sdk-09-examples.test.ts`  
**Flow:** pairing → originate → forbidden originate → logout → activate → disconnect  
**Symptom:** `expected local forbidden without call.originate`

**Verified actual cause (2026-08-02):**

1. Local capability guard **does** reject without `call.originate` (`frames: 0`, `ok: false`).
2. Thrown error is `OmniCallClientError` from workspace package **0.1.4**.
3. Example `crm-app.ts` / `safe-error.ts` import `isOmniCallClientError` from nested
   `examples/crm-pairing-lite/node_modules/@softomnitel/omnicall-kit@0.1.0`.
4. `isOmniCallClientError` uses `instanceof` → **fails across dual package copies**.
5. `originateDemoCall` therefore omits `code: 'forbidden'`; assertion fails.

**Evidence commands:**

```bash
cd omnicall-kit
npx vitest run packages/sdk/src/docs/sdk-09-examples.test.ts
npm ls @softomnitel/omnicall-kit
```

Observed: workspace `0.1.4` + example nested `0.1.0`.  
**Fix belongs in later WU (docs/deps/workspace alignment)** — do not weaken the smoke assertion.
