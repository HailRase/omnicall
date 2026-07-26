# OCP campaign → shell raise

**Дата:** 2026-07-26 17:51
**Статус:** выполнено
**Коммит:** —

## Где
- `src/shared/ipc/ShellWindowRaiseContract.ts`
- `src/renderer/hooks/useShellWindowAttentionFromCampaign.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `docs/softphone/adr/ADR-0013-sdk-window-policy-and-signin.md`
- `docs/softphone/OCP-Call-Context.md`, Feature-Registry, Legacy, STATUS, CHANGELOG

## Что
- Добавлен reason `ocp_campaign_offer` в IPC-контракт shell raise
- Хук поднимает окно при появлении preview `activeCampaign` (один раз на id)
- Progressive campaign не поднимает окно
- Используется общий main-path `ShellWindowAttentionController` / `bringBrowserWindowToFront`

## Зачем
- Оператор должен видеть Accept/Reject модалку кампании, даже если softphone свёрнут/скрыт — без Electron-вызовов из React

## Результат
- vitest: `useShellWindowAttentionFromCampaign` + `ShellWindowRaiseContract` — PASS (5)
