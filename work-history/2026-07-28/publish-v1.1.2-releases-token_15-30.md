# Публикация v1.1.2 после пустого OMNICALL_RELEASES_TOKEN

**Дата:** 2026-07-28 15:30
**Статус:** выполнено
**Коммит:** `1ffd6e9`

## Где
- GitHub Actions secret `OMNICALL_RELEASES_TOKEN`
- `.github/workflows/release.yml` (fallback на `AXATALK_RELEASES_TOKEN`)
- https://github.com/HailRase/omnicall-releases/releases/tag/v1.1.2

## Что
- Preflight/build v1.1.2 были зелёные; publish падал: `DISTRIBUTION_GITHUB_TOKEN is required` (секрет после ребренда не создан, был только `AXATALK_RELEASES_TOKEN`).
- Создан Actions secret `OMNICALL_RELEASES_TOKEN`.
- Re-run failed jobs run `30357634955` → success.
- В workflow добавлен fallback `OMNICALL || AXATALK`.

## Зачем
- Довести публикацию installers OmniCall 1.1.2.

## Результат
- Assets: win `.exe`/`.msi`, mac `.dmg`, linux `.AppImage`/`.deb`.
- Finalize manifest + release notes — PASS.
- Рекомендация: заменить секрет на fine-grained PAT только на `omnicall-releases`.
