# Trigger variable availability help

**Дата:** 2026-08-02 13:44
**Статус:** выполнено
**Коммит:** `80886133`

## Где
- `src/domain/integration/external-services/template/resolveExternalServiceEventVariableGroups.ts`
- `src/renderer/components/settings/external-services/ExternalServicesTriggerVariableHelp.tsx`
- `src/renderer/components/settings/external-services/ExternalServicesTriggerList.tsx`
- `external-services-plan/03-EVENTS-AND-VARIABLES.md`, `05-UI-UX.md`
- `docs/softphone/P14-External-Applications-Design.md`, Feature-Registry, I18N-Coverage, handoff

## Что
- Domain SSoT: event → catalog groups (aligned with mapper + Variables when-hints)
- `?` у каждого события в Triggers/Events (ES + EA) со списком групп и `{{token}}`
- i18n `trigger.help*` ru/en/fr/de/bg; тесты domain + UI
- Документация синхронизирована (без изменения runtime шаблонов)

## Зачем
- Операторы видят, какие переменные реально заполняются на событии (в т.ч. что на `post_call_processing` нет `call_id`)

## Результат
- Focused tests PASS; `messages.test.ts` PASS; `i18n:check` PASS; `tsc --noEmit` PASS
- Downgrade нет: поведение открытия URL / шаблонов не менялось
