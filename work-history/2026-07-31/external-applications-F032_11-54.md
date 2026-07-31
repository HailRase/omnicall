# F-032 External Applications

**Дата:** 2026-07-31 11:54
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/external-applications/`
- `src/application/services/integration/external-applications/`
- `src/main/externalApplications/`
- `src/renderer/components/settings/external-applications/`
- `docs/softphone/Feature-Registry.md` (F-032), `ADR-0024`, `P14-External-Applications-Design.md`

## Что
- Nested `UserSettings.externalApplications` (schema **v14**) + migrate v13→v14
- Automation on Domain events → template resolve → Electron window / system browser
- Typed IPC screen-pop with `applicationId:callId` dedupe
- Settings → Integrations → External Applications UI (ES-like, `{{` autocomplete)
- Docs/i18n/registry/STATUS synced; ADR-0024 Accepted

## Зачем
- Настраиваемые screen-pop окна на события звонка без ломки F-031 HTTP-автоматизаций

## Результат
- Targeted tests 76 PASS; `typecheck` PASS; `i18n:check` PASS; lint F-032 files clean
- Версия не бампалась (pending `/release` → 1.3.0)
