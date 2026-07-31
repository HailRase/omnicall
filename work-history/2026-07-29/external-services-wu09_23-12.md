# F-031 WU-09 request mutations

**Дата:** 2026-07-29 23:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/integration/external-services/mutateExternalServicesRequests.ts`
- `src/application/services/integration/external-services/mutateExternalServicesRequests.test.ts`
- `src/application/index.ts`

## Что
- Добавлены immutable create, rename, toggle, delete, duplicate и replace для HTTP-запросов.
- Дублирование генерирует новые UUID для запроса и query/header строк.
- Полная замена проверяется `parseExternalServicesSettings`.
- Добавлены focused Vitest-тесты и публичные экспорты Application-слоя.

## Зачем
Нужен проверяемый Application API редактора запросов F-031 без зависимостей от renderer.

## Результат
`vitest` и targeted ESLint проходят; полный typecheck и lint блокируются существующими ошибками renderer и сгенерированного SDK `dist`.
