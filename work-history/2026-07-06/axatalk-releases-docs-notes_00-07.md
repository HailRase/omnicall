# Public distribution docs and release notes

**Дата:** 2026-07-06 00:07
**Статус:** выполнено
**Коммит:** —

## Где
- `distribution/README.md`, `distribution/CHANGELOG.md`, `distribution/RELEASE-NOTES-CONTRACT.md`
- `scripts/generate-distribution-release-notes.mjs`, `update-distribution-release-notes.mjs`, `backfill-distribution-release-notes.mjs`
- `.github/workflows/release.yml`, `guides/RELEASE-PLAYBOOK.md`

## Что
- Переписан публичный README на английском (продукт, загрузки, обновления, без внутренних деталей)
- Добавлен публичный английский `distribution/CHANGELOG.md` для всех выпущенных версий
- Добавлен контракт `RELEASE-NOTES-CONTRACT.md` с форматом release body
- Скрипты генерации, публикации и backfill release notes из changelog
- CI `finalize-distribution`: push docs + обновление body релиза на axatalk-releases
- Unit-тесты генератора; npm-скрипты `release:update-notes`, `release:backfill-notes`

## Зачем
Улучшить публичное представление Axatalk в `HailRase/axatalk-releases`: понятный README и структурированные английские release notes для текущих и будущих релизов.

## Результат
- `vitest run scripts/generate-distribution-release-notes.test.mjs` — OK
- `backfill --dry-run` — корректный Markdown для v0.0.1–v0.1.3
- Деплой на axatalk-releases: `npm run release:push-distribution` + `npm run release:backfill-notes` (нужен `AXATALK_RELEASES_TOKEN`)
