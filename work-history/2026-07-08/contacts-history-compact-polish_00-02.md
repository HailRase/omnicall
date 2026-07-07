# Contacts/history compact UI polish

**Дата:** 2026-07-08 00:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/shell/ShellDialpadPanel.tsx`
- `src/renderer/components/list/ListQuickCallButton.tsx`
- `src/renderer/components/contacts/ContactsPanelShell.tsx`, `ContactEditPanel.tsx`
- `src/renderer/components/history/HistoryPanelShell.tsx`
- `src/renderer/components/icons/iconCatalog.ts` (`shell.nav.back`)

## Что
- Компактный iOS-like nav bar: chevron назад + центрированный title + close
- `ListQuickCallButton` — круглые 32px кнопки звонка в списках
- Контакт: hero avatar, card fields, full-width call, edit/delete toolbar
- Edit: поля в card, sm inputs, full-width save
- Списки: 44px rows, 32px avatars, меньше padding и типографика

## Зачем
Отзыв пользователя: громоздко, некрасивые кнопки и навигация — нужна компактность и эргономика.

## Результат
12 focused tests passed; lint, typecheck, i18n:check — green.
