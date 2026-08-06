# F-011 WU-07 hardening

**Дата:** 2026-08-03 00:28
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration`, `src/main/sdk`, `omnicall-kit/packages/sdk`

## Что
- Привязана отмена activate к Origin + clientId.
- Закрыта IPC-авторизация для вспомогательных renderer.
- Синхронизирован AuthClient waitUntil контракт.
- Исправлен статус WU-07 в документации.

## Зачем
- Устранить ghost completion и ложные claims до независимой проверки.

## Результат
- Focused tests и kit preflight PASS; desktop preflight требует повторного запуска после обновления IPC-теста.
