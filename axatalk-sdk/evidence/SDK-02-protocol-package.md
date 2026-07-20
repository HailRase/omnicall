# SDK-02 — `@axatalk/protocol` evidence

**Date:** 2026-07-20  
**Status:** `done` — `/sdk-review` **PASS** 2026-07-20  
**Prerequisites:** SDK-00 `done`, SDK-01 `done` (`/sdk-review` PASS). Desktop DI-01 still `pending`.

**Reviewer:** Independent `/sdk-review` **PASS** 2026-07-20. Follow-up fix same day closed High/Low:

- High: `sdk:permission-changed` → `CapabilityIdListSchema`; `reply.result` / error `details` → `WireJsonObjectSchema` (no `unknown`; known PII keys mask-checked).
- Low: per-export `@public` on constants; additive unknown-key strip fixture+test; extra event/reply fixtures.

Open checklist “desktop consumes fixtures” remains DI-01.

## Scope delivered

- Runtime dependency: `zod@4.4.3` (exact) in `@axatalk/protocol` only.
- Zod schemas → inferred readonly TS types → API report (`etc/api/protocol.api.md`).
- Safe validators (`unknown` → schema) with size/depth/forbidden-key fail-closed codes.
- Golden fixtures under `packages/protocol/fixtures/{valid,invalid,meta}/`.
- Compatibility helpers: negotiate / incompatible / deprecation drop gate.
- Policy helpers: `window:hide` schema-valid but unavailable in v1 product surface; campaign events absent from v1 unions.
- No `AxatalkClient`, transport, crypto runtime, desktop `src/` product changes, or DI-* implementation.

## Public API surface (intentional)

Exports from `@axatalk/protocol`:

- Constants: protocol majors, discovery/WS paths/port, capability IDs, default profiles, error-code list, limits, dedup TTL (120s), forbidden wire keys, deferred campaign event names.
- Schemas + inferred types: discovery, handshake, pairing/auth challenge-proof fields, commands, replies, events, snapshot sections, wire union.
- Helpers: `validateDiscoveryDocument`, `validateWireMessage`, `validateWithSchema`, `findForbiddenWireKeys`, `negotiateProtocolVersion`, `isIncompatibleProtocolVersion`, `isProtocolMajorDropAllowed`, `isCommandAvailableInProductV1`, `productDenialCodeForCommand`, `buildPopSigningPayload` (string template only).
- Package export `./fixtures/*` for byte-identical DI-01 consumption.
- **Not exported:** `AxatalkClient`, transport, WebSocket, IndexedDB/crypto client.

`api:check` updated: `@axatalk/sdk` remains empty; `@axatalk/protocol` must export symbols and must not export `AxatalkClient`.

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
- `window:hide` parses as schema but `productDenialCodeForCommand` → `forbidden` for v1 product surface (ADR-0013).

## Tests and package checks

Commands (cwd `axatalk-sdk`):

```bash
npm run build -w @axatalk/protocol
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

## Desktop DI-01 consume contract (gap — not faked)

DI-01 is **not done**. Checklist item “desktop consumes the same fixtures successfully” remains open and is **blocked on DI-01**, not on missing SDK fixtures.

DI-01 must:

1. Depend on workspace `@axatalk/protocol` (or identical published package) **outside Domain**.
2. Load fixture bytes from `axatalk-sdk/packages/protocol/fixtures/**` (or package export `./fixtures/*`) **without translation**.
3. Run valid → accept / invalid → `expectedErrorCode` from sibling `meta/**/*.meta.json`.
4. Keep Domain free of Zod/protocol imports; validate only at Application/adapter boundaries.
5. Not invent a second schema language.

No minimal desktop fixture runner was added in this session (prefer DI-01 checklist ownership; avoid product gateway / Domain coupling).

**Desktop DI-02 evidence:** N/A (prerequisite DI-01 absent).

## Remaining risks

- DI-01 may discover schema tightness issues (opaque-id regex, mask refinements, reply `result` as open record) when wiring real mappers — resolve via ADR or additive fixture updates, not a second schema stack.
- Zod ~78 KiB gzip may be revisited if a later size gate fails (Valibot alternative already recorded in ADR-0014).
- `window:hide` remains in command union for future policy; product gateways must enforce denial until ADR-0013 tray policy lands.
- Full interop freeze still requires DI-01 fixture consume + later DI-02/SDK-04 auth runtime.

## Evidence paths

- Package: `axatalk-sdk/packages/protocol/`
- Fixtures: `axatalk-sdk/packages/protocol/fixtures/`
- API report: `axatalk-sdk/etc/api/protocol.api.md`
- Dependencies: `axatalk-sdk/docs/DEPENDENCIES.md`
- This file: `axatalk-sdk/evidence/SDK-02-protocol-package.md`
