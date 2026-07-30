# External Services variables discoverability

**Дата:** 2026-07-30 13:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/external-services/template/ExternalServiceVariableCatalog.ts`
- `src/renderer/components/settings/external-services/ExternalServicesSystemVariablesHelp.tsx`
- `src/renderer/components/settings/external-services/ExternalServicesRequestEditor.tsx`
- `src/renderer/components/settings/external-services/ExternalServicesRequestUrlBar.tsx`
- `external-services-plan/03-EVENTS-AND-VARIABLES.md`, `05-UI-UX.md`, `00-PRODUCT-SPEC.md`, `11-ACCEPTANCE.md`
- `docs/softphone/Feature-Registry.md`, `I18N-Coverage.md`, handoff P14

## Что
- Domain SSoT-каталог системных переменных (`EXTERNAL_SERVICE_VARIABLE_CATALOG`)
- Вкладка Variables в редакторе запроса: группы, описания, Insert в URL/Body
- Hint под URL + обновлённый диалог переменных коллекции (system precedence)
- i18n ru/en/fr/de/bg для `settings.integrations.externalServices.variables.*`
- Тесты каталога и UI; синхронизация plan/registry/I18N/handoff

## Зачем
- Оператор мог сам увидеть `call_id` / `user_login` и синтаксис `{{name}}` без чтения developer docs

## Результат
- `vitest` catalog + requests editor: PASS (19)
- `npm run i18n:check`: PASS
- `npm run typecheck` + `ui:catalog`: PASS
- Без изменений HTTP/триггеров/схемы — без downgrade F-031
