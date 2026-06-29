# Форма аккаунта — modern card redesign

**Дата:** 2026-06-29 23:14
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/account/AccountPanel.module.css`
- `src/renderer/components/settings/panels/SettingsAccountPanel.module.css`

## Что
- Карточка в стиле SaaS: elevation, скругление 12px, заголовок и подзаголовок по центру
- Поля с отступом 16px, лейблы caption, инпуты 44px с hover/focus ring
- Primary CTA на всю ширину; «Выйти» — ghost secondary
- Ошибка в alert-баннере внутри формы
- Состояние «Подключение…» при submitting
- `htmlFor` / `autoComplete` для a11y

## Зачем
Улучшить визуальное качество формы SIP-аккаунта в настройках по современным UX-паттернам.

## Результат
- test / lint / typecheck — ok
