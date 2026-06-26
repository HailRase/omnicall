# Settings sidebar motion and overflow fix

**Дата:** 2026-06-26 12:51
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsSidebar.tsx`, `.module.css`
- `src/renderer/components/settings/SettingsPanel.module.css`

## Что
- Убран горизонтальный scroll: `overflow-x: hidden`, `min-width: 0`, фиксированный layout-slot 56px
- Плавная анимация ширины и подписей через `framer-motion` (0.28s, `prefers-reduced-motion`)
- Развёрнутый режим: полупрозрачный фон + `backdrop-filter: blur(10px)`

## Зачем
UX sidebar: без артефактов скролла, плавное раскрытие поверх контента, читаемый glass-эффект.

## Результат
Тесты sidebar OK; lint, typecheck — OK.
