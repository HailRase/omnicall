# Release cut v0.0.3 test

**Дата:** 2026-07-01 18:10
**Статус:** выполнено
**Коммит:** —

## Где
- `package.json`, `CHANGELOG.md`, manifest JSON
- tag `v0.0.3` → CI Release

## Что
- PATCH 0.0.2 → 0.0.3, sync manifest, preflight OK
- Push tag → build + publish axatalk-releases

## Зачем
Тест пайплайна дистрибуции после фиксов CI.

## Результат
Дождаться зелёного Release; проверить axatalk-releases v0.0.3 (4 installers only).
