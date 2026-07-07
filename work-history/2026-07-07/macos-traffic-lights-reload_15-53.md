# macOS traffic lights — reload вместо maximize (F-016)

**Дата:** 2026-07-07 15:53
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/index.ts`
- `src/renderer/hooks/useShellWindowControls.ts`
- `src/renderer/components/shell/ShellWindowControls.tsx`
- `src/renderer/components/shell/ShellWindowControls.module.css`
- `src/renderer/components/shell/ShellTitleBar.module.css`
- `src/renderer/components/settings/SettingsFullscreenOverlay.tsx`
- `src/renderer/components/settings/SettingsFullscreenOverlay.module.css`
- `src/renderer/styles/tokens.css`
- `docs/softphone/Feature-Registry.md`

## Что
- macOS переведён на frameless shell с кастомными traffic lights (без native maximize)
- Три кнопки: Close → Minimize → Reload; серые по умолчанию, цвет при hover на конкретную кнопку
- Reload — маленькая иконка (7px), без tooltip, на месте зелёной кнопки
- Убран spacer под native traffic lights в titlebar и settings overlay
- Добавлены токены цветов traffic lights для light/dark
- Обновлены тесты и Feature Registry (F-016)

## Зачем
Убрать серую неактивную кнопку maximize на macOS и встроить reload в ряд window controls с нативным визуальным поведением.

## Результат
- `npm run test -- --run ShellWindowControls.test.tsx ShellTitleBar.test.tsx SettingsFullscreenOverlay.test.tsx SoftphoneShellHeader.test.tsx` — 12/12 OK
- `npm run lint`, `npm run typecheck` — OK
