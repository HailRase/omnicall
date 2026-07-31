# F-031 Send button and breadcrumb polish

**Дата:** 2026-07-30 09:58
**Статус:** выполнено
**Коммит:** —

## Где
- `ExternalServicesRequestEditor.tsx`
- `ExternalServices.module.css`

## Что
- Send: outline 32×32, `radius-control`, иконка 14px (не primary)
- Breadcrumb: имя запроса ограничено (~14rem), коллекция остаётся видимой

## Зачем
- Визуально согласовать Send с Save и не прятать имя коллекции

## Результат
- typecheck + focused tests PASS
