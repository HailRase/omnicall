# Contacts/History Phase 2 — Profile Switch Reload

**Дата:** 2026-07-08 11:11
**Статус:** выполнено
**Коммит:** `f4e4b01`

## Где
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/stores/useAccountBootstrapStore.ts`
- `src/renderer/navigation/routeData/ShellRouteDataController.tsx`
- `src/renderer/navigation/routeData/useProfileScopedRouteDataReset.ts`
- `src/renderer/navigation/routeData/useShellRouteDataLoader.ts`
- `src/renderer/navigation/routeData/loadCoordinator.ts`
- `docs/softphone/Contacts-History-Identity-Persistence-Plan.md`
- `docs/softphone/Feature-Registry.md`

## Что
- Добавлен `refreshProfileScopedDataProjections` в `AccountBootstrapFacade` для перезагрузки contacts/history активного профиля.
- `useAccountBootstrapStore.bindFacade` вызывает reload на `RegistrationSucceeded` (после успешной регистрации).
- Добавлен `useProfileScopedRouteDataReset`: сброс route-data store и load coordinator при смене `deriveActiveProfileSettingsSyncKey`.
- `useShellRouteDataLoader` перезапускает list-load при смене sync key на маршрутах contacts/history.
- Интеграционные тесты A→B→A (facade + real bootstrap) и renderer reload test.
- Обновлены Feature Registry (F-013, F-025) и план (Phase 2 done).

## Зачем
- Исключить показ контактов/истории предыдущего SIP-аккаунта после переключения профиля или logout без удаления файлов на диске.

## Результат
- `npx vitest run` (3 файла, 38 тестов) — PASS
- `npm run lint` — PASS
