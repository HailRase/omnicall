# Исправление опечатки ondemosever → onedemoserver

**Дата:** 2026-06-24 15:30
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/real-integration/env.local.example`
- тесты и mock с примерами hostname

## Что
- Заменён неверный hostname `ondemosever.online` на `onedemoserver.online`

## Зачем
ERR_NAME_NOT_RESOLVED: DNS не резолвит опечатку в примерах env.

## Результат
Пользователю нужно обновить `.env.local` и поле Server в UI вручную.
