# Manual Run now: user_login

**Дата:** 2026-08-01 17:44
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/readExternalServicesProductStateFromStore.ts`
- `src/application/integration/buildExternalServicesManualRunFacts.ts`
- `src/renderer/hooks/externalServicesPanel/buildExternalServicesRequestEditorProps.ts`
- `src/application/use-cases/integration/OpenExternalApplicationNowUseCase.ts`
- `external-services-plan/03-EVENTS-AND-VARIABLES.md`, `04-EXECUTION-ENGINE.md`

## Что
- Send/Open now передают snapshot-факты: `user_login` (SIP → fallback OCP) и focused call
- Composition обогащает parties звонка из tracker при наличии
- Документация F-031/F-032 и Feature Registry синхронизированы

## Зачем
- Закрыть дыру, из‑за которой `{{user_login}}` на ручном Send становился `undefined` при авторизованном профиле/OCP

## Результат
- Фокусные тесты + `typecheck` — PASS
- Автотриггеры не меняли контракт; call/campaign/acd вне контекста по-прежнему `undefined`
