# F-024 Step 2 — Saved account profiles application layer

**Дата:** 2026-07-06 10:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/ports/settings/SavedAccountProfileRepository.ts`
- `src/adapters/settings/InMemorySavedAccountProfileRepository.ts`
- `src/application/use-cases/ListSavedAccountProfilesUseCase.ts`
- `src/application/use-cases/SaveAccountProfileUseCase.ts`
- `src/application/use-cases/DeleteSavedAccountProfileUseCase.ts`
- `src/application/use-cases/TouchSavedAccountProfileUseCase.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/use-cases/SavedAccountProfileUseCases.test.ts`
- `src/application/facades/AccountBootstrapFacade.test.ts`

## Что
- Port `SavedAccountProfileRepository` (list/save/delete/touch/getById)
- In-memory adapter для mock/tests
- Use cases: List, Save (idempotent), Delete, Touch
- Facade: `listSavedAccountProfiles`, `saveSavedAccountProfile`, `deleteSavedAccountProfile`, `authorizeSavedAccountProfile`
- `authorizeManualAccount` расширен опцией `saveProfile`; backward-compat с `correlationId` string
- После saved-profile auth — `touchLastUsedAt`

## Зачем
Оркестрация сохранённых SIP-профилей через Application без смешивания с `SettingsRepository`.

## Результат
- Saved profile tests: 22/22 PASS
- `npm run typecheck` — PASS
- Следующий шаг: file persistence adapter + bootstrap (Step 3)
