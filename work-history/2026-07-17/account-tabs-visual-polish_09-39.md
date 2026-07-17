# Полировка табов аккаунта

**Дата:** 2026-07-17 09:39
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPanel.module.css`
- `src/renderer/components/settings/panels/SettingsAccountPanel.module.css`

## Что
- Стилизованы hover и selected-состояния SIP/OCP табов по паттерну табов сохранённых профилей.
- Сохранена равная ширина двух режимов.
- SIP-форма сохранённого профиля выровнена сверху по центру вместо вертикального центрирования.
- UI-каталог пересобран.

## Зачем
- Сделать выбранный режим визуально понятным и выровнять SIP/OCP формы в Account.

## Результат
- Account/SettingsAccountPanel тесты — 24/24.
- `npm run typecheck` — успешно.
- `npm run lint` — успешно.
- `npm run ui:catalog` — успешно.
