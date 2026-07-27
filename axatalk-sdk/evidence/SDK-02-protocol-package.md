# SDK-02 — `@axata/axatalk-protocol` evidence

**Date:** 2026-07-20  
**Status:** `done` — `/sdk-review` **PASS** 2026-07-20  
**Prerequisites:** SDK-00 `done`, SDK-01 `done` (`/sdk-review` PASS). Desktop DI-01 still `pending`.

> **Superseded note (2026-07-27):** `V1_PRODUCT_UNAVAILABLE_COMMANDS` is empty;
> `window:hide` is product-available (ADR-0013 amendment). Policy text below that says
> “unavailable in v1” describes SDK-02 gate day only.

**Reviewer:** Independent `/sdk-review` **PASS** 2026-07-20. Follow-up fix same day closed High/Low:

- High: `sdk:permission-changed` → `CapabilityIdListSchema`; `reply.result` / error `details` → `WireJsonObjectSchema` (no `unknown`; known PII keys mask-checked).
- Low: per-export `@public` on constants; additive unknown-key strip fixture+test; extra event/reply fixtures.

Open checklist “desktop consumes fixtures” remains DI-01.

## Scope delivered

- Runtime dependency: `zod@4.4.3` (exact) in `@axata/axatalk-protocol` only.
- Zod schemas → inferred readonly TS types → API report (`etc/api/protocol.api.md`).
- Safe validators (`unknown` → schema) with size/depth/forbidden-key fail-closed codes.
- Golden fixtures under `packages/protocol/fixtures/{valid,invalid,meta}/`.
- Compatibility helpers: negotiate / incompatible / deprecation drop gate.
- Policy helpers: `window:hide` schema-valid; **SDK-02 gate day** product surface denied via
  `V1_PRODUCT_UNAVAILABLE_COMMANDS` (**emptied 2026-07-27** — hide product-available);
  campaign events deferred historically (now ADR-0019).
- No `AxatalkClient`, transport, crypto runtime, desktop `src/` product changes, or DI-* implementation.

## Public API surface (intentional)

Exports from `@axata/axatalk-protocol`:

- Constants: protocol majors, discovery/WS paths/port, capability IDs, default profiles, error-code list, limits, dedup TTL (120s), forbidden wire keys, deferred campaign event names.
- Schemas + inferred types: discovery, handshake, pairing/auth challenge-proof fields, commands, replies, events, snapshot sections, wire union.
- Helpers: `validateDiscoveryDocument`, `validateWireMessage`, `validateWithSchema`, `findForbiddenWireKeys`, `negotiateProtocolVersion`, `isIncompatibleProtocolVersion`, `isProtocolMajorDropAllowed`, `isCommandAvailableInProductV1`, `productDenialCodeForCommand`, `buildPopSigningPayload` (string template only).
- Package export `./fixtures/*` for byte-identical DI-01 consumption.
- **Not exported:** `AxatalkClient`, transport, WebSocket, IndexedDB/crypto client.

`api:check` updated: `@axata/axatalk-sdk` remains empty; `@axata/axatalk-protocol` must export symbols and must not export `AxatalkClient`.

## Protocol compatibility impact

- Additive optional fields remain compatible (Zod object strip default).
- Wire `protocolVersion` / handshake ranges outside `PROTOCOL_MIN..PROTOCOL_MAX` → `incompatible_version`.
- Campaign events rejected (`invalid_message`).
- Shared fixture corpus is the freeze input for later DI-02; contract not frozen until DI-01 consumes identical bytes.

## Security / privacy

- Forbidden keys (`apiKey`, `ocpAuthToken`, SIP password aliases, etc.) fail closed via structural walk before schema parse.
- Event/snapshot phone + display-name fields require ADR-0017 mask formats.
- Fixtures are synthetic; no real secrets/PII.
- PoP fields are schema-only (no private key material in package).
- `window:hide` parses as schema; **SDK-02 gate day** `productDenialCodeForCommand` →
  `forbidden` (**emptied list 2026-07-27** — product-available under ADR-0013 amendment).

## Tests and package checks

Commands (cwd `axatalk-sdk`):

```bash
npm run build -w @axata/axatalk-protocol
npx vitest run packages/protocol/src/index.test.ts
npx vitest run --typecheck.only packages/protocol/src/index.test-d.ts
npm run lint
npm run preflight
```

Results (2026-07-20):

| Command | Result |
| --- | --- |
| protocol unit tests | PASS (7) |
| protocol type tests | PASS (3) |
| lint | PASS |
| preflight (build, test, typecheck, api, package) | **PASS** |

Zod size evidence recorded in `docs/DEPENDENCIES.md`: esbuild ESM bundle ≈532.6 KiB raw / **~78.0 KiB gzip**.

## Desktop DI-01 consume contract (closed by DI-01)

DI-01 is in **`review`**. Desktop now depends on workspace `@axata/axatalk-protocol`
(`file:axatalk-sdk/packages/protocol`) outside Domain and consumes
`packages/protocol/fixtures/**` byte-identical (valid accept / invalid + meta codes).

Evidence: `axatalk-sdk-integration/evidence/DI-01-protocol-ports-mocks.md`.

**Desktop DI-02 evidence:** N/A until DI-01 `/sdk-review` PASS.
## Remaining risks

- DI-01 may discover schema tightness issues (opaque-id regex, mask refinements, reply `result` as open record) when wiring real mappers — resolve via ADR or additive fixture updates, not a second schema stack.
- Zod ~78 KiB gzip may be revisited if a later size gate fails (Valibot alternative already recorded in ADR-0014).
- `window:hide` remains in the command union; product gateways enforce privileged matrix +
  telephony-busy policy (ADR-0013 amended 2026-07-27) — not a permanent v1 deny.
- Full interop freeze still requires DI-01 fixture consume + later DI-02/SDK-04 auth runtime.

## Evidence paths

- Package: `axatalk-sdk/packages/protocol/`
- Fixtures: `axatalk-sdk/packages/protocol/fixtures/`
- API report: `axatalk-sdk/etc/api/protocol.api.md`
- Dependencies: `axatalk-sdk/docs/DEPENDENCIES.md`
- This file: `axatalk-sdk/evidence/SDK-02-protocol-package.md`
