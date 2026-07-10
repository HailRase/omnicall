# T-014 Headset vendor profile registry (EXT-1/2/3)

**Дата:** 2026-07-10 16:59
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/headset/types/`
- `src/adapters/headset/webhid/profiles/`
- `src/adapters/headset/webhid/resolveHeadsetVendorProfile.ts`
- `src/adapters/headset/webhid/WebHidHeadsetAdapter.ts`
- `src/adapters/headset/webhid/hidParsers.ts`, `hidLedOutput.ts`, `ledProfiles.ts`

## Что
- Введён `HeadsetVendorProfile` + registry `resolveHeadsetVendorProfile` (match order сохранён)
- Jabra/Poly/generic вынесены в per-vendor profile files (parser + LED + capabilities)
- Jabra first-report `hookOff` quirk перенесён в `profile.quirks`
- `WebHidHeadsetAdapter` — transport-only, без inline vendor `if`
- Snapshot/match/quirk unit tests; починены pre-existing typecheck/lint blockers для gate

## Зачем
- Новый HID vendor = новый profile file + registry entry, без правок orchestrator

## Результат
- Regression gate green: 98 tests (golden + profile), typecheck, lint
- F-012 note: vendor profiles registry introduced (no user-visible change)
- T-014 / EXT-1/2/3 done; next: T-015 / EXT-4
