# RAT: документация real adapters

**Дата:** 2026-06-24 01:10
**Статус:** выполнено
**Коммит:** `0b860f5`

## Где
- `docs/softphone/real-integration/` — промпт, steps 00–07, PROGRESS, smoke
- `docs/softphone/adr/ADR-0001-real-adapter-integration.md`

## Что
- MASTER-AGENT-PROMPT для подключения JsSIP / media / OCP WS
- 8 step-файлов (branch → transfer deferred)
- PROGRESS.md и SMOKE-CHECKLIST для resume между агентами
- env.local.example (шаблон секретов, без .env в git)
- ADR-0001: mock default, real opt-in, vertical slices

## Зачем
Безопасный старт реальной интеграции в ветке `feature/real-adapters` без поломки mock/CI на master.

## Результат
- Ветка `feature/real-adapters` запушена на origin
- `npm run test` не менялся (только docs)
