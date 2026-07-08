# Release v0.9.0

**Дата:** 2026-07-08 22:30
**Статус:** выполнено
**Коммит:** `20a8f21`

## Где
- `package.json`, `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json`, `docs/softphone/STATUS.md`
- ветка `main`, тег `v0.9.0`

## Что
- Закоммичены и запушены изменения F-002 (incoming call overlay) с `feature/real-adapters`
- Merge `feature/real-adapters` → `main`
- Исправлены lint/typecheck блокеры перед релизом (TruncatedTextLine test, transfer panel shell test)
- SemVer MINOR: `0.8.0` → `0.9.0`
- CHANGELOG (internal + distribution), manifest sync, STATUS Release train
- Тег `v0.9.0` запушен → CI `release.yml`

## Зачем
Выпуск дистрибуции с глобальным оверлеем входящего звонка (F-002) и фиксом CSV-импорта контактов (F-025).

## Результат
- `npm run release:preflight` — pass
- Push: `main` + `v0.9.0` — ok
- CI Release: https://github.com/HailRase/softphone-electron/actions/workflows/release.yml
- Distribution release: https://github.com/HailRase/axatalk-releases/releases/tag/v0.9.0
- Manifest: https://raw.githubusercontent.com/HailRase/axatalk-releases/main/update-manifest.json
