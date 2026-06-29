# Форма аккаунта — без скролла

**Дата:** 2026-06-29 23:15
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsPanel.tsx`
- `src/renderer/components/settings/SettingsPanel.module.css`
- `src/renderer/components/settings/panels/SettingsAccountPanel.module.css`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/account/AccountPanel.module.css`

## Что
- Секция «Аккаунт»: `contentBodyFit` — flex-центрирование, `overflow: hidden`
- Убран дублирующий заголовок карточки (есть в header настроек)
- Поля в сетке 2×2, компактные отступы и инпуты 38px
- Кнопки в одну строку; уменьшены padding/gap карточки

## Зачем
Форма должна помещаться в видимую область настроек без вертикального скролла.

## Результат
- AccountPanel + SettingsPanel tests, lint, typecheck — ok
