# Release cut v1.3.0

**Дата:** 2026-08-02 21:29
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json` (`1.3.0`)
- `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json` (+ docs copies)
- `docs/softphone/STATUS.md` Release train
- branch `video-refactorin` synced to `main`

## Что
- MINOR cut: F-034 Notification Center, F-033 ringtone, F-032 External Applications, always-on-top, post-call trigger
- Preflight: tests 3066/1 skip; lint + typecheck + registry green
- Tag `v1.3.0` → CI `release.yml` → omnicall-releases
- `video-refactorin` обновлена до актуального `main`

## Зачем
- Опубликовать накопленные user-visible фичи после явного `/release`

## Результат
- Версия **1.3.0**; проверка Actions Release + raw manifest после push
