# Форма аккаунта — кнопки и поля

**Дата:** 2026-06-29 23:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/account/AccountPanel.module.css`

## Что
- Кнопки «Авторизоваться» и «Выйти» — сетка 1:1, одинаковая ширина
- «Выйти» — нейтральный secondary (`logoutAction`), без красного danger
- Поля: caption-лейблы, focus-ring, чуть аккуратнее padding

## Зачем
Лёгкая полировка формы без смены группировки; logout визуально соответствует выходу, не кричит.

## Результат
- test / lint / typecheck — ok
