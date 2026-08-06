# Release cut v1.4.0

**Дата:** 2026-08-06 23:04
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json` (`1.4.0`)
- `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json` (+ docs copies)
- `docs/softphone/STATUS.md` Release train

## Что
- MINOR cut: F-032 External Applications UX (choice cards, switch previews, geometry editor); F-016 first-run sign-in CTA
- Fixes: F-028 OCP progress/banner/recovery; F-031 journal isolation; account SIP error toasts (ADR-0026)
- `release:preflight` PASS; `release:sync-manifest` → 1.4.0
- Tag `v1.4.0` → CI `release.yml` → omnicall-releases

## Зачем
- Опубликовать накопленные user-visible изменения после `/release`

## Результат
- Версия **1.4.0**; проверка Actions Release + raw manifest после push
