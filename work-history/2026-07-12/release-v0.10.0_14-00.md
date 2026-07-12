# Release v0.10.0

**Дата:** 2026-07-12 14:00
**Статус:** выполнено
**Коммит:** `722a5a6` (merge `ad37bcf`)

## Где
- `package.json`, `CHANGELOG.md`, `distribution/CHANGELOG.md`, `distribution/update-manifest.json`
- `docs/softphone/release/update-manifest.json`, `docs/softphone/examples/update-manifest.json`
- `docs/softphone/STATUS.md`

## Что
- Merge `feature/real-adapters` → `main` (конфликт CHANGELOG разрешён)
- Release cut **v0.10.0** (MINOR): F-012 headset, F-027 video, F-013 history, SIP-only removal
- `npm run release:preflight` green (1844 tests)
- Tag `v0.10.0` + push `main` и `feature/real-adapters` синхронизированы

## Зачем
- Зафиксировать накопленные user-visible фичи и выровнять main/real-adapters после merge

## Результат
- Preflight: gate_pass
- Tag push → CI `release.yml` публикует в axatalk-releases
