# Settings account authorize/logout buttons

**Дата:** 2026-06-26 13:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPanel.tsx`
- `src/application/projections/deriveAccountPanelActionsShell.ts`
- `src/renderer/hooks/useAccountPanelShell.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`

## Что
- Рядом с «Авторизоваться» добавлена кнопка «Выйти» в настройках → Аккаунт
- Логика enable/disable через `deriveAccountPanelActionsShell`
- Подсказки при наведении на disabled через `IconTooltip` (1 с)

## Зачем
Управление сессией из settings account: авторизация и выход с понятными причинами блокировки.

## Результат
729 tests passed; lint, typecheck, ui:catalog — OK.
