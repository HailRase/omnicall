# Preflight: lint + typecheck fix

**Дата:** 2026-08-06 17:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/integration/QueryExternalServicesUseCase.test.ts`
- `src/renderer/components/settings/external-applications/ExternalApplicationsPanel.test.tsx`
- `src/renderer/hooks/useExternalApplicationsPanel.test.tsx`
- `src/application/services/integration/OcpBackedSignInOrchestrationService.test.ts`

## Что
- Убраны `async` без `await` в journal mock (`Promise.reject` / `Promise.resolve`)
- Nested `expect.objectContaining` заменены на `toMatchObject` (no-unsafe-assignment)
- Типизированы mock-колбэки facade; sync `act` для `onToggle`
- Gate SIP authorize: definite assignment `releaseAuthorize!` вместо `| null` (TS2349)

## Зачем
- Закрыть Blockers preflight (lint 16 + typecheck 1), чтобы можно было идти в `/review` / `/audit`

## Результат
- `npm run lint` — green
- `npm run typecheck` — green
- vitest (4 файла) — 30 passed
