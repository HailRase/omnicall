# Contacts empty state and dialpad contacts shortcut

**Дата:** 2026-07-08 00:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/contacts/ContactsPanelShell.*`
- `src/renderer/components/dialpad/Dialpad.*`
- `src/renderer/shells/call/CallControlsShell.tsx`
- `src/renderer/components/icons/iconCatalog.ts`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`

## Что
- Hover кнопки «Позвонить»: `&&`-селекторы перебивают outline hover UI Kit
- Пустой список контактов: иконка `shell.contacts` (Users), компактная кнопка «Добавить» (`outline` + `sm`)
- Dialpad: иконка контактов в поле ввода при пустом номере, delete при введённом
- Навигация в контакты из dialpad с блокировкой без SIP-регистрации
- i18n (5 локалей), Icon Registry, unit-тесты

## Зачем
Исправить визуальные дефекты карточки контакта и пустого списка, добавить быстрый переход к контактам с dialpad.

## Результат
20 unit-тестов passed; `lint`, `typecheck`, `i18n:check` — OK.
