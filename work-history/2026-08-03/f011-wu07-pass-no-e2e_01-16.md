# F-011 WU-07 PASS без E2E-критерия

**Дата:** 2026-08-03 01:16
**Статус:** выполнено
**Коммит:** —

## Где
- `omnicall-kit-integration/sdk-production-readiness/*`
- `docs/softphone/{STATUS,TASK-QUEUE,Feature-Registry}.md`
- `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md`
- `docs/softphone/adr/ADR-0027-sdk-session-revision-coordinator.md`
- `omnicall-kit{,/docs,/AGENTS.md}` и `omnicall-kit-integration/{AGENTS,README,TEST-MATRIX,WORK-UNITS,SMOKE-CHECKLIST}.md`
- `.cursor/skills/omnicall-kit-integration/SKILL.md`

## Что
- Убран обязательный packaged Electron / Chromium / Edge smoke из gate-критериев F-011/WU-07.
- Агентам явно запрещено запускать/требовать smoke-скрипты; gate = unit + integration + preflight.
- F-011 → `implemented`; T-054 / WU-07 → `done` / **PASS**.
- Исторические DI-10/SMOKE артефакты помечены как archive-only.

## Зачем
- Пользователь исключил E2E из SDK-гейта, чтобы следующие агенты не блокировались на smoke.

## Результат
- Документация и agent-контракты синхронизированы; версия/publish/commit не выполнялись.
- Опора на уже зелёный desktop preflight 3110/1 и kit preflight из предшествующей верификации.
