# Local account profiles — ports (Step 3)

**Дата:** 2026-07-06 00:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/ports/settings/SettingsRepository.ts`
- `src/adapters/settings/InMemorySettingsRepository.ts`
- `src/adapters/settings/InMemorySettingsRepository.test.ts`
- `src/adapters/settings/FileSettingsRepository.ts`
- `src/adapters/settings/FileSettingsRepository.test.ts`

## Что
- Порт расширен: `getActiveProfileKey`, `setActiveProfileKey`, `listKnownProfileKeys`.
- `InMemorySettingsRepository`: `activeProfileKey` в state, composite key через domain, изоляция bucket'ов, save inactive не меняет active aggregates.
- `FileSettingsRepository`: делегирование active-profile методов in-memory слою.
- +6 тестов: isolation, switch, inactive save, list keys, file delegation.

## Зачем
Контракт репозитория для per-account settings и переключения активного профиля без filesystem.

## Результат
- `npm run test -- src/adapters/settings` — 18 passed
- `npm run test` — 1136 passed, 1 skipped
- `npm run lint`, `npm run typecheck` — OK
- Facade/orchestration и disk persistence — Step 4–6.
