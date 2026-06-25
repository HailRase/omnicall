# P11 WU0 — Shell Layout

**Дата:** 2026-06-25 13:55
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/widgets/SoftphoneLayout/`
- `src/renderer/shells/SoftphoneReadyShell.tsx`, `SoftphoneShellHeader.tsx`
- `src/renderer/shells/call/` (CallContextShell, CallControlsShell, CallOverlayShell)
- `src/renderer/hooks/useCallFeatureShell.ts`, `useOverlayShell.ts`
- `src/renderer/components/shell/ShellOverlaySheet.tsx`
- `docs/softphone/handoffs/P11-WU0-Shell-Layout-Handoff.md`

## Что
- Добавлен виджет `SoftphoneLayout` с зонами Header / Context / Controls / OverlayLayer
- `SoftphoneReadyShell` переведён на четырёхзонную композицию; `CallFeatureShell` разбит на zone shells
- Кнопки Settings и Diagnostics в header открывают stub overlay (`ShellOverlaySheet`)
- Dev-only: `sip-registered-hint` и subtitle заголовка за `import.meta.env.DEV`
- `App.tsx` упрощён (30 строк); shell chrome передаётся в `SoftphoneReadyShell`
- Тесты layout/overlay + Storybook story; `ui:catalog` обновлён

## Зачем
Фундамент P11 UI для читаемого manual/RAT smoke: зоны видны в dev, настройки открываются поверх контекста звонка без размонтирования ContextZone.

## Результат
- Gate WU0: зоны, settings overlay stub, dev hints — OK
- `npm run test` — 643 passed, 1 skipped
- `npm run lint` — OK
- `npm run typecheck` — OK
- `npm run ui:catalog` — 38 components
