# Форма аккаунта в настройках — центрирование

**Дата:** 2026-06-29 23:10
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/account/AccountPanel.module.css`
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`
- `src/renderer/components/settings/panels/SettingsAccountPanel.module.css`

## Что
- Добавлен вариант раскладки `layout="centered"` для `AccountPanel`
- Форма в настройках: фиксированная ширина 20rem, центрирование в контентной зоне
- Карточка полей в стиле `settingsGroup` (бордер, разделители, типографика как в General)
- Инпуты на всю ширину карточки с focus-ring через токены
- Кнопки «Авторизоваться» / «Выйти» равной ширины в нижней строке
- Экран авторизации (`AuthAccountShell`) без изменений — `layout` по умолчанию

## Зачем
Улучшить UX формы SIP-аккаунта в настройках: компактная центрированная форма с фиксированной шириной полей, согласованная с остальными секциями настроек.

## Результат
- `npm run test` (AccountPanel) — ok
- `npm run lint` — ok
- `npm run typecheck` — ok
