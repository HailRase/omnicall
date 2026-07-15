# OCP Integrations login picker (logic)

**Дата:** 2026-07-15 23:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/ocp/resolveOcpConnectLoginTarget.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `docs/softphone/Feature-Registry.md`, `TASK-QUEUE.md` (T-031 `/ui`)
- `ocp-integration/OCP-Smoke-Checklist.md` (SM-11 + UI contract)

## Что
- Domain: resolve existing/new/ambiguous login → settings `accountKey`
- Facade: `listOcpConnectLoginOptions`, `getOcpModulePanelState`, scoped OCP save/connect
- Cross-profile OCP save не трогает live SIP recovery / auto-answer другой сессии
- autoConnect/retry остаются на active SIP bucket (без даунгрейда)
- React input-select вынесен в T-031 `/ui`

## Зачем
Сделать явным, под каким login идёт OCP Connect в Integrations, и сохранять domain/api-key в bucket этого login.

## Результат
- `npm run test` — 2062 passed, 1 skipped
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- Минимальный type-unblock: проброс `authorizeViaOcp*` в SettingsPanel + test defaults
- Следующий шаг: `/ui` по T-031
