# RAT: real-integration-agent reviewer

**Дата:** 2026-06-24 09:25
**Статус:** выполнено
**Коммит:** —

## Где
- `.cursor/skills/real-integration-agent/SKILL.md`
- `.cursor/skills/real-integration-agent/templates.md`
- `.cursor/rules/real-integration-agent.mdc`
- `docs/softphone/real-integration/README.md`

## Что
- Скилл gate-keeper для RAT: discovery, invariants, severity, verdict
- Шаблоны Refactor Prompt и Continuation Prompt для implementation-agent
- Cursor rule с триггером `@real-integration-agent`
- README: таблица агентов и шаг review после каждого step
- Первичный review: трек docs-only, step 00 не закрыт

## Зачем
Автоматизировать проверку real-integration по правилам проекта и выдавать промт на рефакторинг или продолжение работы.

## Результат
- `npm run test` — 488 passed
- `npm run lint` / `typecheck` — OK
- Implementation не начат; continuation prompt выдан на завершение step 00
