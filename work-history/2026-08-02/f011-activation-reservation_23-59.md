# F-011 activation reservation

**Дата:** 2026-08-02 23:59
**Статус:** не выполнено
**Коммит:** —

## Где
- src/application/integration/ExternalSdkAccountHandler.ts
- src/application/integration/SdkSessionRevisionCoordinator.ts

## Что
- Добавлено резервирование revision для ожидания consent/auth вне aggregate mutex.
- Финализация повторно проверяет reservation и текущую revision.
- Добавлены детерминированные проверки неблокирующего observation и stale commit.

## Зачем
- Уменьшить блокировку SDK aggregate при интерактивной активации.

## Результат
- Focused Vitest: 24 passed; git diff --check passed. Остальные запрошенные F-011 блокеры не реализованы в этой сессии.
