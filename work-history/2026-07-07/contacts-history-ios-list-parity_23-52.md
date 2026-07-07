# Contacts/History iOS list design parity

**Дата:** 2026-07-07 23:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/list/PersonListAvatar.tsx`
- `src/renderer/components/history/HistoryPanelShell.tsx`
- `src/renderer/components/contacts/ContactsPanelShell.tsx`
- `src/renderer/helpers/derivePersonInitials.ts`, `groupHistoryRowsByDate.ts`
- `src/renderer/hooks/useCallHistoryShell.ts`
- `src/renderer/shells/contacts/ContactsShellRoutePanel.tsx`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`

## Что
- iOS-подобные строки списка: аватары с инициалами, высота 52px, quick-call через `IconControlButton`
- История: группировка по датам, фильтр All/Missed (Tabs), подсветка пропущенных, иконки направления
- Контакты: поиск, empty state с подсказкой, быстрый звонок из списка
- i18n ключи для ru/en/fr/de/bg; тесты и ui:catalog обновлены

## Зачем
Первый bounded WU из Variant 2 UX brief — визуальный паритет списков без смены shell-архитектуры.

## Результат
13 focused tests passed; lint, typecheck, i18n:check, ui:catalog — green.
Не реализовано (конфликт с docs): bottom tab bar, swipe/gestures, Favorites, alphabet scrubber, iOS ActionSheet delete.
