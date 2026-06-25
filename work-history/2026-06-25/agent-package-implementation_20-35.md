# Agent package: implementation + holistic reviewer

**Дата:** 2026-06-25 20:35
**Статус:** выполнено
**Коммит:** —

## Где
- `.cursor/skills/scope-intake`, `ui-implementation-agent`, `domain-implementation-agent`, `holistic-reviewer`, `_shared/response-contract.md`
- `.cursor/rules/ui-implementation-agent.mdc`, `domain-implementation-agent.mdc`, `holistic-reviewer.mdc`
- `.cursor/commands/` — ui, logic, audit, scope, preflight, plan-wu, registry, adapter
- `docs/softphone/Cursor-Agents-Guide.md`, `TASK-QUEUE.md`
- `AGENTS.md`, `docs/softphone/README.md`

## Что
- 4 новых skill + единый response-contract (статусы, Severity, таблицы)
- 3 implementation/review rules + 8 commands
- RU guide для разработчика: команды, циклы, регистрация в доках
- TASK-QUEUE для scope-intake default
- softphone-reviewer подключён к response-contract

## Зачем
Предсказуемые агенты `/ui` и `/logic` с intake; super reviewer `/audit`; документация для управления.

## Результат
- Файлы созданы; тесты не затронуты
- Следующий шаг: попробовать `/scope` → `/ui` в новом чате
