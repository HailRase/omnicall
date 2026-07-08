# Contacts toolbar и кликабельные уведомления

**Дата:** 2026-07-08 13:25
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/contacts/ContactsPanelShell.tsx`
- `src/renderer/components/contacts/ContactsPanelShell.module.css`
- `src/renderer/components/icons/iconCatalog.ts`
- `src/renderer/components/notifications/NotificationViewport.module.css`
- `src/renderer/components/ui/sonner/Sonner.module.css`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`

## Что
- Кнопка «Добавить» заменена на иконку `contact.add` (`UserRoundPlus`) в списке и пустом состоянии
- Поиск, CSV-меню и добавление контакта выстроены в одну горизонтальную линию
- Исправлена некликабельность уведомлений: `pointer-events: auto` на Sonner toaster
- Кнопка закрытия toast перенесена вправо через CSS-переменные Sonner
- Добавлена иконка `contact.add` в Icon Registry и i18n (ru/en/fr/de/bg)

## Зачем
Привести UX контактов и уведомлений к ожидаемому дизайну: компактный тулбар, иконка добавления, рабочее закрытие toast.

## Результат
`npm run test` — 1706 passed; `npm run typecheck`, `npm run i18n:check` — OK; eslint на затронутых файлах — OK.
