# Defer OCP plugin to far backlog

**Дата:** 2026-06-24 22:07
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/OCP-PLUGIN-BACKLOG.md` (новый)
- `docs/softphone/adr/ADR-0002-defer-ocp-plugin.md` (новый)
- `.cursor/rules/ocp-deferred.mdc` (новый)
- `docs/softphone/README.md`, `Feature-Registry.md`, `Legacy-Feature-Coverage.md`, `Implementation-Roadmap.md`, `Architecture-Constitution.md`, `MASTER_SYSTEM_PROMPT.md`, `Agent-Prompts.md`
- `docs/softphone/real-integration/*` (PROGRESS, SMOKE, MASTER-AGENT, README, 00-SNAPSHOT, step-06, env.local.example)
- `docs/softphone/adr/ADR-0001-real-adapter-integration.md`
- `.cursor/skills/real-integration-agent/SKILL.md`, `.cursor/rules/real-integration-agent.mdc`

## Что
- Создан канонический backlog OCP с resume checklist и картой legacy LF/F
- ADR-0002: продуктовое решение отложить OCP; активный RAT — step 07 transfer
- Cursor rule `ocp-deferred.mdc` (alwaysApply) для всех агентов
- Feature Registry: F-009/F-010/F-015 → `deferred_backlog`
- RAT step 06 / smoke R5 → `deferred`; PROGRESS blocker снят
- Обновлены real-integration prompts, smoke checklist, reviewer skill

## Зачем
Сфокусировать разработку на SIP softphone без блокировок и вопросов агентов по OCP; сохранить plugin-архитектуру и legacy registry для возврата.

## Результат
- Документация согласована; код OCP не удалён (dormant в sip-only)
- Активный трек: RAT step 07, SIP R1–R4 closed
- Возврат: «resume OCP backlog» + `OCP-PLUGIN-BACKLOG.md`
