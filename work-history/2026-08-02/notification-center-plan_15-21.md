# План Notification Center

**Дата:** 2026-08-02 15:21
**Статус:** выполнено
**Коммит:** —

## Где
- `notification-center/` (новый план на ветке `feature/notification-center`)
- База ветки: `origin/main`

## Что
- Создана ветка `feature/notification-center` от `origin/main`
- Добавлен executable-план по канону `external-services-plan` (README, 00–12, PROGRESS, AGENT-CONTINUATION)
- Зафиксированы F-034, ADR-0025, T-053 как целевые идентификаторы трека
- Зафиксирован compatibility law: defaults сохраняют текущие toast/journal/ADR-0013 raises
- WU-08 (raise) и WU-09 (OS) явно optional/deferrable

## Зачем
- Дать senior-level дорожную карту единого Notification Center (prefs + policy + Settings hub) без даунгрейда текущего поведения

## Результат
- План готов к WU-00; реализация кода не начиналась
- Коммит не создавался (ожидает явного запроса пользователя)
