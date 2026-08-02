# SDK Production-Readiness WU-07 — Reopened

**Дата:** 2026-08-02 23:59
**Статус:** не выполнено
**Коммит:** —

## Где
- `src/application/integration/{SdkSessionRevisionCoordinator,SdkOperatorEventRevisionGate,ExternalSdk*Handler}.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `src/main/sdk/createSdkGatewayProductSurface.ts`
- `omnicall-kit/packages/sdk/src/internal/product-orchestrator.ts`
- `omnicall-kit/packages/sdk/src/public/{omnicall-client,omnicall-client-api}.ts`
- `omnicall-kit-integration/sdk-production-readiness/{PROGRESS,CLOSEOUT}.md`
- `docs/softphone/{Feature-Registry,STATUS,TASK-QUEUE}.md`

## Что
- Убран mutable revision clock из публичного coordinator API; event advance сериализован coordinator mutex.
- Idempotency cache/in-flight изолирован по Origin + clientId + requestId; cleanup выполнен в `finally`.
- `sdk:native-window` отклоняет IPC не от основного renderer webContents.
- Старые inbound snapshot/event сообщения от другого serverInstanceId/sessionEpoch отбрасываются до cache, sequence, resync и listeners.
- Исправлен lint `ExternalSdkWindowHandler.test.ts`.
- `waitUntil` принимает AbortSignal и выбрасывает typed `WaitUntilTimeoutError`.
- WU-07/T-054/F-011 документация возвращена в in-progress; прежний closeout помечен superseded.
- Исправлен trailing whitespace в SDK guide.

## Зачем
Вернуть корректный gate: устранить ложное закрытие и восстановить надёжную сериализацию revision.

## Результат
- Focused coordinator/window tests: PASS (16); их eslint: PASS; SDK typecheck PASS.
- Root release preflight ранее остановился на lint; package preflight PASS. Packaged Chromium/Edge E2E не запускался.
- Остались activation two-phase, identity isolation tests, coherent snapshot/native observation, public SDK DX и независимый review.
