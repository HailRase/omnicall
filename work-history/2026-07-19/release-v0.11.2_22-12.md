# Release cut v0.11.2

**Дата:** 2026-07-19 22:12
**Статус:** выполнено
**Коммит:** `6c389b4`

## Где
- `package.json`
- `CHANGELOG.md`, `distribution/CHANGELOG.md`
- `distribution/update-manifest.json` (+ docs copies)
- `docs/softphone/STATUS.md` (Release train)

## Что
- Bump `0.11.1` → `0.11.2` (PATCH: OCP modal Disconnect/reconnect + overwrite modal UX).
- CHANGELOG internal + public English notes; compare links для 0.11.x / 0.10.4.
- `npm run release:sync-manifest` → `latestVersion` 0.11.2.
- Tag `v0.11.2` на `main`; release commit пропагирован в `ocp-integration`, `feature/real-adapters`, `video-refactorin`.

## Зачем
- Пользовательский release cut после merge OCP-интеграции в основные ветки; актуальный manifest во всех рабочих ветках.

## Результат
- `npm run release:preflight` — OK.
- Tag push → CI `release.yml` публикует installers в axatalk-releases.
