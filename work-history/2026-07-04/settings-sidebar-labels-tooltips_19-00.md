# Settings sidebar labels and collapsed tooltips

**Дата:** 2026-07-04 19:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsSidebar.tsx`
- `src/renderer/components/settings/SettingsSidebar.module.css`
- `src/renderer/components/settings/SettingsSidebar.test.tsx`
- `src/renderer/components/icons/IconTooltip.tsx` (`placement` prop)
- `docs/softphone/Feature-Registry.md` (F-016)

## Что
- Длинные подписи (напр. «Состояние системы») переносятся на 2 строки вместо обрезки
- Убрано ограничение `maxWidth: 140` в анимации label; кнопки nav с `min-height: 40px`, auto height
- Свёрнутый sidebar: `IconTooltip` с `placement: right` на всех nav-иконках
- Развёрнутый sidebar: tooltip отключён (пустой label), подписи видны inline
- Кнопка expand/collapse уже имела tooltip через `IconControlButton`
- Тесты: полный текст system-state, tooltip collapsed/expanded

## Зачем
Подпись «Состояние системы» обрезалась; в свёрнутом режиме не было подсказок у иконок разделов.

## Результат
- `npm run test` — 1034 passed, 1 skipped
- `npm run lint` — green
- `npm run typecheck` — green
