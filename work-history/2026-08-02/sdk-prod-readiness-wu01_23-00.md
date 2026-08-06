# SDK production-readiness WU-01 — Shared revision coordinator

**Дата:** 2026-08-02 23:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/SdkSessionRevisionCoordinator.ts`
- `src/application/integration/ExternalSdkCallHandler.ts`
- `src/application/integration/ExternalSdkAccountHandler.ts`
- `src/application/integration/ExternalSdkOperatorHandler.ts`
- `src/application/integration/externalSdkLogoutCommands.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `omnicall-kit-integration/sdk-production-readiness/`
- `docs/softphone/Feature-Registry.md`, `STATUS.md`, `TASK-QUEUE.md`, `handoffs/P12-…`, `adr/ADR-0027-…`

## Что
- Добавлен Application-owned `SdkSessionRevisionCoordinator` (peek / stale_state / aggregate serialize / post-success advance)
- Call / account / operator mutation paths переведены на координатор; nested per-call mutex сохранён
- `alreadyAuthenticated` reauth — `advance: false`; reads/ping без advance
- Window clock не трогали (WU-02); §A/§B acceptance разведены
- Тесты координатора + обновлены handler suites; pending stub удалён

## Зачем
- ADR-0027 / ADR-0017: один публичный aggregate revision authority для product CRM mutations

## Результат
- `npx vitest run` (5 файлов integration): **58 passed**
- WU-01 → status **review**; next WU-02; нужен независимый `/sdk-review`
