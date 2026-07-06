# F-024 Step 5 — Auth error mapping

**Дата:** 2026-07-06 11:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/mapAccountAuthorizationError.ts`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/settings/panels/SettingsAccountPanel.tsx`
- `src/renderer/i18n/messages.ts`
- `docs/softphone/Feature-Registry.md`

## Что
- Добавлен маппер `PlatformError` → `AccountAuthorizationErrorKey` (credentials, network, profile not found, validation, unknown)
- `useAccountActions` возвращает `errorKey` вместо сырого `error.message`
- `AccountPanel` / Settings Account рендерят ошибки через i18n (`ru`/`en`/`fr`/`de`)
- Unit-тесты маппера, hook и component для локализованных ошибок
- Feature Registry F-024 обновлён (Step 5 evidence)

## Зачем
Показать пользователю безопасные локализованные сообщения при ошибках SIP-авторизации без утечки сырого SIP-текста и паролей.

## Результат
- `npm run test` (23 теста Step 5) — PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run i18n:check` — pre-existing hardcoded string в `settingsAccountTestDefaults.ts` (не из Step 5)
