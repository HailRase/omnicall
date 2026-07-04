# Native title → IconTooltip

**Дата:** 2026-07-04 19:18
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallControlsBar.tsx`
- `src/renderer/components/call/TransferPanel.tsx` + `.module.css`
- `src/renderer/components/dialpad/Dialpad.tsx` + `.module.css`
- `src/renderer/components/header/UserAvatarMenu.tsx` + `.module.css`
- `src/renderer/components/header/UserHeaderIdentity.tsx` + `.module.css`
- `src/renderer/components/header/RegistrationStatusDot.tsx`
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.tsx`
- тесты: `UserAvatarMenu.test.tsx`, `SettingsSystemStatePanel.test.tsx`

## Что
- Заменены нативные HTML-атрибуты `title` на `IconTooltip` во всех renderer-компонентах с hover-подсказками
- Добавлены host-классы (`*TooltipHost`) для сохранения flex/width/truncation layout
- Обновлены тесты: проверка portal-tooltip вместо `title`-атрибута
- Пропсы `title` модалок и placeholder-панелей не затронуты (это заголовки, не tooltips)

## Зачем
Единообразные styled tooltips (300 ms delay, floating-ui, light/dark tokens) вместо нативных браузерных подсказок.

## Результат
- `npm run test` — 1034 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
