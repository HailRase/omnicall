# Step 01: Adapter Mode Bootstrap

## Goal

Factory selects mock vs real without duplicating facades.

## Feature IDs

F-000 (composition), no new Feature ID.

## Tasks

1. Add `AdapterMode = "mock" | "real"` in `src/infrastructure/bootstrap/adapterMode.ts`.
2. Resolve mode: URL `?adapters=real|mock` > `import.meta.env.VITE_ADAPTER_MODE` > `"mock"`.
3. Refactor bootstrap:
   - `createMockAccountBootstrap(options)` — current `createAccountBootstrap` body
   - `createRealAccountBootstrap(options)` — stub throwing typed error until step 02
   - `createSoftphoneComposition({ mode, ...options })` — dispatcher
4. Keep `createAccountBootstrap` as alias to mock path for backward compatibility in tests.
5. Update `src/renderer/bootstrap/readBootstrapConfig.ts` — export `adapterMode`.
6. Update `src/renderer/hooks/useAccountBootstrap.ts` — pass resolved mode.
7. Unit tests: mode resolution; mock path unchanged.

## UX

No visible change in default mock mode.

## Gate

- Default mock: all tests green
- `?adapters=real` reaches stub without crash (clear error UI acceptable)

## Expected files

- `src/infrastructure/bootstrap/adapterMode.ts`
- `src/infrastructure/bootstrap/createSoftphoneComposition.ts`
- `src/infrastructure/bootstrap/createMockAccountBootstrap.ts`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
- `src/infrastructure/bootstrap/adapterMode.test.ts`

## Update PROGRESS

Mark step 01 `done`.
