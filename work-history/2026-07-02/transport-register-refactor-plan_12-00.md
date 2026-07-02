# План рефакторинга SIP transport/register

**Дата:** 2026-07-02 12:00
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md`
- `docs/softphone/TASK-QUEUE.md` (T-008)
- `AGENTS.md`

## Что
- Создан master-plan на 8 фаз (Domain → Adapter → Orchestration → Projections → UI)
- Зафиксирован продуктовый контракт: единый индикатор, приоритет transport > registration > DND
- Описан модуль настроек «Состояние системы» (политики, статусы, ручные действия, журнал)
- Убраны overlay recovery, OCP из scope, presence offline/online
- Добавлен протокол запуска агента (prompts в §0 плана)
- JsSIP reference: transport events, effectiveRegistered, configuration

## Зачем
Довести до конца тему SIP-соединения, регистрации и перерегистрации без возвратов к расхождениям UX/логики.

## Результат
План готов к исполнению агентом по фазам; T-008 в TASK-QUEUE.
