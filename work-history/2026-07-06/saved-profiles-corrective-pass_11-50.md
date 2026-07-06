# Saved SIP Account Profiles — corrective pass (F-024)

**Дата:** 2026-07-06 11:50
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/projections/mapAccountAuthorizationError.ts`
- `src/renderer/components/account/SavedAccountProfileSelector.tsx`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/hooks/useAccountActions.ts`
- `src/infrastructure/bootstrap/createMockAccountBootstrap.ts`
- `docs/softphone/Feature-Registry.md` (F-024 → implemented)

## Что
- Метаданные профиля (save/touch) после успешной SIP-регистрации не блокируют авторизацию; предупреждения через `metadataWarning`
- Разделены локальные и серверные ошибки; SIP 403/404 не маппятся в «неверный пароль» / `profileNotFound`
- Табы вместо select; password-only панель для неавторизованного сохранённого профиля
- Безопасное переключение A→B: unregister перед register (только при submit)
- `createMockAccountBootstrap` инжектит `savedAccountProfileRepository`
- Настройки применяются после успешной регистрации (`applyActiveProfileSettingsSideEffects` перенесён после register)

## Зачем
Закрыть review findings по F-024: корректная семантика auth vs metadata, серверные ошибки, tab UX, безопасное переключение профилей без хранения паролей.

## Результат
- `npm run test` — 1265 passed
- `npm run lint`, `npm run typecheck`, `npm run i18n:check`, `npm run registry:check` — PASS
