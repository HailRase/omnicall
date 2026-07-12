# Release v0.10.3

**Дата:** 2026-07-13 00:26
**Статус:** выполнено
**Коммит:** `cb0bfd6`

## Где
- `package.json`, `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json`, `docs/softphone/release/update-manifest.json`, `docs/softphone/examples/update-manifest.json`
- `docs/softphone/STATUS.md`
- ветки `main`, `feature/real-adapters`, тег `v0.10.3`

## Что
- Закоммичены и запушены video UX изменения на `feature/real-adapters`
- Fast-forward merge `feature/real-adapters` → `main`
- Исправлены preflight: `shellOverlayIncomingCall.test` (ResizeObserver), CSS module types для ScreenSharePickerDialog
- Release cut **0.10.3** (PATCH): CHANGELOG, manifest sync, STATUS Release train
- Тег `v0.10.3` запушен; `main` синхронизирован с `feature/real-adapters`

## Зачем
Выпустить накопленные video UX hardening изменения и синхронизировать manifest/версию на обеих рабочих ветках.

## Результат
- `npm run release:preflight` — passed
- Push: `main`, `feature/real-adapters`, tag `v0.10.3`
- CI Release workflow triggered on tag push
- Manifest URLs: `v0.10.3` на win32/darwin/linux
