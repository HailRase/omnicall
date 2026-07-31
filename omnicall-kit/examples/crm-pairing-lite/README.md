# CRM Pairing Lite (example)

**Fake peer only — not a production desktop.**

Integrator-facing helpers under `src/` use **only** the public `@softomnitel/omnicall-kit` surface.
The runnable fake-peer demo lives next to SDK-09 tests:

- `packages/sdk/src/docs/crm-pairing-lite-demo.ts`
- `packages/sdk/src/docs/crm-pairing-lite-harness.ts`

Demonstrates:

1. Pairing → `ready` → snapshot subscribe
2. Call originate with revision bind + typed `forbidden` when cap missing
3. Single-shot `logout` `interaction_required` honesty (no `logoutToken`)
4. Optional `activateProfile` only when the **fake peer grants** `account.activate`
   (never via `requestedCapabilities`)
5. `disconnect()` leaves calls / account session alone (zero hangup / logout / activate)

## Run

From `omnicall-kit/`:

```bash
npm run build
npx vitest run packages/sdk/src/docs
npm run docs:check
```

## Security defaults

- Memory PoP store only in the demo harness (no `localStorage` / `sessionStorage`)
- Privileged caps never requested at pairing
- Errors print `code` / `retryable` / `currentRevision` only — never raw `details`
- Destinations use opaque refs (`ext:1001`), not live phone numbers

## Layout

| File | Role |
| --- | --- |
| `src/crm-app.ts` | Integrator helpers — public `@softomnitel/omnicall-kit` only |
| `src/safe-error.ts` | Typed error formatting without secret dumps |
| `../../packages/sdk/src/docs/crm-pairing-lite-*.ts` | Fake peer driver (workspace tests; not published) |
