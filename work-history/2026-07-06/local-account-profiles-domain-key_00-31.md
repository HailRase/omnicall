# Local account profiles — domain key (Step 2)

**Дата:** 2026-07-06 00:31
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/deriveSettingsAccountKey.ts`
- `src/domain/settings/deriveSettingsAccountKey.test.ts`
- `src/domain/settings/resolveSettingsAccountKey.ts`
- `src/domain/settings/resolveSettingsAccountKey.test.ts`
- `src/domain/settings/SettingsAccountKey.ts`
- `src/domain/index.ts`

## Что
- Composite profile key: `username@domain` (+ `|serverHost` когда server ≠ domain).
- Pure helpers: normalize username/domain, extract server host from WS/URL/host:port.
- `resolveSettingsAccountKeyFromSipAccount` переведён на `deriveSettingsAccountKeyFromIdentity`.
- 17 новых/обновлённых unit-тестов (trim, case, suffix, anonymous, collision, no password in key).

## Зачем
Детерминированный ключ профиля для per-account settings без пароля в ключе.

## Результат
- `npm run test -- src/domain/settings` — 39 passed
- `npm run test` — 1130 passed, 1 skipped
- `npm run lint`, `npm run typecheck` — OK
- Адаптеры не обновлены: `InMemorySettingsRepository` всё ещё username-only (Step 3).
