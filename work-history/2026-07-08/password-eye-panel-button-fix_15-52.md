# Password eye icon state and panel button fix

**Дата:** 2026-07-08 15:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/shell/BootstrapPanel.module.css`
- `src/renderer/components/account/AccountPasswordField.tsx`

## Что
- Toggle исключён из `.panel button` через `data-password-toggle` — убраны border/background в обычном состоянии
- Иконка: `!visible` → перечёркнутый глаз (`form.password.hide`), видимый пароль → обычный глаз (`form.password.show`)

## Зачем
BootstrapPanel стилизовал все кнопки в панели; логика иконки была инвертирована относительно ожидания пользователя.

## Результат
`AccountPanel.test.tsx` — 6/6.
