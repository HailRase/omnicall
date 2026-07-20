# DI-08 Saved-Profile Activation

**Дата:** 2026-07-20 17:22
**Статус:** выполнено
**Коммит:** `510eb38`

## Где
- `src/application/integration/ExternalSdkAccountHandler.ts` (+ port / Facade binding)
- `src/adapters/integration/sdkAccountActivateGrantStore.ts` + approval/capability/session sync
- `src/adapters/integration/localWsSessionInbound.ts`, `localWsSessionRevoke.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `axatalk-sdk-integration/evidence/DI-08-saved-profile-activation.md`

## Что
- Privileged `account:activate-profile` → `command_broker` после capability + local approval
- Opaque `profileRef` (prf_ + base64url) и short-lived grant TTL 120s
- Unified `signInAccount` без секретов на WS/IPC; logout-first → `conflict`
- `/sdk-review` PASS → DI-08 `done`; Low remediation: WS revoke/disconnect, OCP-disabled test, TTL cap strip, registry split

## Зачем
- Открыть безопасный SDK path активации сохранённых профилей (F-011 / P12 DI-08) без raw credentials

## Результат
- Focused DI-04…DI-08: 140 passed; `npm test` 2482/1; lint/typecheck PASS; registry 74/0; version 0.11.2
- Следующее: `/sdk-integration` DI-09 only
