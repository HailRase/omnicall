# Application layer structure refactor

**Дата:** 2026-07-08 11:50
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/{telephony,operator,settings,contacts,platform,updates}/`
- `src/application/projections/{telephony,operator,settings,contacts,platform}/`
- `src/application/services/{telephony,operator,contacts,recovery,platform}/`
- `src/application/index.ts`, `src/application/facades/AccountBootstrapFacade.ts`
- `docs/softphone/Feature-Registry.md`, `I18N-Coverage.md`, `TRANSPORT-REGISTER-STATE-REFACTORING.md`, `Contacts-History-Identity-Persistence-Plan.md`
- `docs/softphone/handoffs/P08-SIP-Registration-Retry-Handoff.md`, `P11-WU2-Call-Line-UX-Handoff.md`

## Что
- Разложены flat use-cases (82), projections (89), services (66) по bounded-context подпапкам
- Root-level modules в `use-cases/`, `projections/`, `services/` удалены (0 файлов на корне)
- Обновлены все imports: `@application/*` и `../services|use-cases|projections/*` → context subpaths
- Публичный barrel `src/application/index.ts` сохранён, те же exported symbols
- Обновлены path references в registry, i18n coverage, transport refactor doc, contacts plan
- Обновлены неархивные handoffs со stale paths (P08, P11-WU2)

## Зачем
- Убрать чрезмерно flat application layout и сгруппировать модули по ownership без смены поведения

## Результат
- Flat import scan (`src/**/*.ts`): **0 matches**
- Root modules в target folders: **0**
- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — **1670 passed**, 1 skipped (352 files)
- `npm run registry:check` — pass (29 paths)
- `npm run i18n:check` — pass (366 files)
- Renderer hooks/helpers не переносились (только imports)
- `src/domain/settings/` не изменялся
- Version bump не выполнялся
