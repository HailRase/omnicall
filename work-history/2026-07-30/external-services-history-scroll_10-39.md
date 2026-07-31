# Прокрутка истории ответов

**Дата:** 2026-07-30 10:39
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-services/ExternalServicesResponsePane.tsx`
- `src/renderer/components/settings/external-services/ExternalServices.module.css`

## Что
- Контейнер вкладок Response/History теперь занимает ограниченную высоту панели.
- Содержимое каждой вкладки прокручивается независимо, включая Response History.
- Обновлены типы CSS Modules.

## Зачем
- Длинная история запросов остаётся доступной внутри рабочей области настроек.

## Результат
- `npx vitest run ...ExternalServicesJournal... ...ExternalServicesRequestsEditor...` — PASS (12 тестов).
- `npm run lint` и `npm run typecheck` — PASS.
