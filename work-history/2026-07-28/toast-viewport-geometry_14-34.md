# Геометрия viewport уведомлений

**Дата:** 2026-07-28 14:34
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/notifications/`
- `docs/softphone/Feature-Registry.md`
- `docs/softphone/UI-Design-System.md`

## Что
- Убран лишний горизонтальный резерв titlebar-кнопок у верхних уведомлений.
- Ограничена ширина Sonner viewport и каждого тоста доступной шириной BrowserWindow.
- Добавлена плавная адаптация геометрии с поддержкой `prefers-reduced-motion`.
- Обновлены unit/component-тесты, реестр, legacy coverage, очередь и статус.

## Зачем
- Уведомления не должны выходить за компактное окно при переходе между основным экраном и полноэкранными настройками.

## Результат
- `npm run test` — PASS (2744 passed, 1 skipped).
- `npm run lint` — PASS.
- `npm run typecheck` — PASS.
- `npm run i18n:check` и `npm run registry:check` — PASS.
- `ui:catalog:check` выявил существующую несинхронизированную генерацию каталога из параллельных изменений; каталог не изменялся в рамках задачи.
