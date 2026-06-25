# P05 WU6 multi-call product decisions

**Дата:** 2026-06-25 10:45
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/P05-Multi-Call-Product-Decisions.md`
- `docs/softphone/MULTI-CALL-BACKLOG.md`
- `docs/softphone/handoffs/P05-WU6-Multi-Call-Completeness-Agent-Prompt.md`
- `docs/softphone/real-integration/step-08-multi-call-real.md`
- Feature Registry, Legacy Coverage, PROGRESS, SMOKE R7, real-integration-agent SKILL

## Что
- Зафиксированы product decisions A–G (edge-case сессия пользователя)
- Agent decisions: B1 rollback, B3 no retry, C1 single remote audio
- Промпт implementation-agent WU6-1…WU6-9
- RAT step 08 + smoke R7; active track обновлён

## Зачем
Единый источник правды для мультисессий и fail-safe без сброса звонков.

## Результат
Документация готова; реализация WU6 не начата (только docs).
