# Buffer is not defined — fix profile persistence in renderer

**Дата:** 2026-07-06 01:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/settings/profileStoragePaths.ts`
- `src/adapters/settings/profileStoragePaths.test.ts`
- `src/application/use-cases/AuthorizeSipAccountUseCase.ts`
- `src/application/facades/AccountBootstrapFacade.ts`

## Что
- Заменён Node `Buffer` на `TextEncoder`/`TextDecoder` + `btoa`/`atob` (renderer-safe base64url)
- Тест совместимости с ранее сохранёнными именами файлов (`MTAwMUBwYnguZXhhbXBsZQ`)
- jsdom-тест для browser-like окружения
- try/catch при persist на authorize → `operation_failed` вместо необработанного throw
- `authorizeManualAccount`: catch ошибок refresh settings после authorize

## Зачем
При real-mode авторизации `FileSettingsRepository` работает в renderer; `encodeProfileKeyForFileName` вызывал `Buffer`, недоступный в browser context.

## Результат
- profileStoragePaths + authorize/facade tests: PASS
- lint, typecheck: PASS
