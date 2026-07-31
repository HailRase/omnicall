# Evidence — Official browser WebSocket transport defaults

**Date:** 2026-07-23  
**Status:** done (gap-fill aligned with ARCHITECTURE.md; not a separate WORK-UNITS ID)  
**Scope:** ship `createBrowserWebSocketTransport` + optional browser defaults for
`transportFactory` / `scheduler` / `jitter`; document in `docs/guide/transport.md`.

## Delivered

1. `packages/sdk/src/internal/browser-websocket-transport.ts` — thin text-only WS adapter.
2. `createBrowserScheduler` / `createBrowserJitterSource` in `scheduler.ts`.
3. `AuthClientOptions` / `OmniCallClientOptions`: transport/scheduler/jitter optional with
   browser defaults (explicit inject still required for deterministic unit tests).
4. Unit tests: `browser-websocket-transport.test.ts`.
5. Guide: `docs/guide/transport.md`; pairing quick start no longer uses a throw stub.
6. API allowlist + `etc/api/sdk.api.md` → **54** symbols.

## Non-goals respected

- No protocol / reconnect / auth inside the adapter.
- No desktop gateway changes.
- FakeTransport remains test-only (not published).
- Existing callers that pass `transportFactory` / `scheduler` / `jitter` keep working
  (additive optional fields — no downgrade).

## Verification

```bash
cd omnicall-kit
npx vitest run packages/sdk/src
npm run build
npm run api:check
npm run docs:check
npm run preflight
```

## Remaining risks

- HTTPS → loopback LNA still browser/OS dependent (ADR-0015); adapter does not invent fetch fallbacks.
- Node hosts without `globalThis.WebSocket` must keep injecting `transportFactory`.
