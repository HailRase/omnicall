# Shell attention raise calls and SDK

**Дата:** 2026-07-22 12:24
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/platform/bringBrowserWindowToFront.ts`
- `src/main/shellWindow/ShellWindowAttentionController.ts`
- `src/shared/ipc/ShellWindowRaiseContract.ts`, `IpcChannels.ts`, `PreloadApi.ts`, `preload/index.ts`
- `src/main/index.ts`, `src/main/sdk/registerSdkGateway.ts`
- `src/adapters/integration/LocalWsServerAdapter.ts`, pairing/origin-trust approvers
- `src/renderer/hooks/useShellWindowAttentionFromCalls.ts`, `useShellWindowAttentionFromSdk.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- ADR-0013, TEST-MATRIX, SMOKE, UX blueprint, Feature Registry, SECURITY, CHANGELOG

## Что
- Общий native bring-to-front helper + attention controller (dedupe по callId/requestId)
- IPC `shell:window-raise` / `shell:operator-attention`
- Raise на входящий/исходящий звонок (edge в shell hook)
- Raise в main на Origin TOFU и pairing; pairing открывает Integrations
- Raise на activate-consent; second-instance через тот же helper
- SDK `window.show` rate limit 1s сохранён отдельно от telephony

## Зачем
- Окно Axatalk должно подниматься поверх приложений не только по SDK show, но и при звонках и запросах pairing/trust

## Результат
- focused vitest: 34 passed
- eslint touched: ok (после стабилизации deps)
- версия не bump (Unreleased)
