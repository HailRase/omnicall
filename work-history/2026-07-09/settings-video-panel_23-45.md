# Settings Video panel

**Дата:** 2026-07-09 23:45
**Статус:** выполнено
**Коммит:** —

## Где
- `src/ports/media/LocalMediaCapturePort.ts`
- `src/adapters/media/browser/BrowserLocalMediaCaptureAdapter.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/components/settings/panels/SettingsVideoPanel.tsx`
- `src/renderer/hooks/useVideoSettingsPanel.ts`
- `src/renderer/i18n/messages.ts` (+ bg)

## Что
- Порт/адаптер: enumerate devices, camera preview start/stop, opaque handle binding
- Settings → Video: mic/camera, live preview, default view, auto-fullscreen + substring
- Wiring через facade + `useSettingsActions` / `SoftphoneReadyShell`
- i18n ru/en/fr/de/bg; тесты панели/адаптера; STATUS + Feature Registry

## Зачем
- Закрыть пробел WU2: UI для video prefs из `UserSettings` v5 без MediaStream в Zustand/Domain

## Результат
- `npm run typecheck` — green
- targeted vitest (adapter + Settings Video/Panel/overlay) — 22 passed
- F-027 остаётся in progress до WU8 SBC smoke
