# Release cut v1.4.0

**Дата:** 2026-08-06 23:20
**Статус:** выполнено
**Коммит:** `e4c80a5c` (cut) · tag `v1.4.0` → `81b064a1` (dispatch publish path)

## Где
- `package.json` (`1.4.0`)
- `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json` (+ docs copies)
- `docs/softphone/STATUS.md` Release train
- `.github/workflows/release.yml` (tag-ref `workflow_dispatch` + `publish`)

## Что
- MINOR cut: F-032 External Applications UX (choice cards, switch previews, geometry editor); F-016 first-run sign-in CTA
- Fixes: F-028 OCP progress/banner/recovery; F-031 journal isolation; account SIP error toasts (ADR-0026)
- `release:preflight` PASS; `release:sync-manifest` → 1.4.0
- Push tag не запускал Actions (webhook); publish через `gh workflow run … -f publish=true`

## Зачем
- Опубликовать накопленные user-visible изменения после `/release`

## Результат
- Версия **1.4.0** опубликована на omnicall-releases
- Actions: https://github.com/HailRase/omnicall/actions/runs/31127394922 (success)
- Release: https://github.com/HailRase/omnicall-releases/releases/tag/v1.4.0
- Manifest `latestVersion` 1.4.0; installer URLs HTTP 200 (exe/dmg/AppImage)
