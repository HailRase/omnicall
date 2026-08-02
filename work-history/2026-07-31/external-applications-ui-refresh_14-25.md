# UI refresh внешних приложений (F-032)

**Дата:** 2026-07-31 14:25
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-applications/*`
- `src/renderer/hooks/useExternalApplicationsPanel.ts`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `I18N-Coverage.md`, `Icon-Registry.md`

## Что
- Убран header сайдбара; кнопка «Добавить» закреплена снизу списка
- У items: зелёный/красный индикатор и меню ⋯ (вкл/выкл, переименовать, дублировать, удалить)
- Убраны верхний Input названия и Switch; название — inline rename
- Sticky URL-бар с кнопкой «Открыть» справа; pinned tabs Общее / События / Переменные
- Обновлены i18n (ru/en/fr/de/bg), тесты и реестры

## Зачем
- Выровнять UX External Applications с паттерном External Services

## Результат
- `npx vitest run …/ExternalApplicationsPanel.test.tsx` — pass
- `npm run typecheck` — pass
- `npm run ui:catalog` — pass
