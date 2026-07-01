# Update manifest all platforms F-020

**Дата:** 2026-07-01 16:00
**Статус:** выполнено
**Коммит:** `c5407db`

## Где
- `docs/softphone/release/update-manifest.json`
- `docs/softphone/examples/update-manifest.json`

## Что
- Добавлены `platforms.darwin` (mac-arm64.dmg) и `platforms.linux` (linux-x86_64.AppImage)
- Push в `main`

## Зачем
In-app «Скачать» на macOS/Linux — прямые ссылки на Release v0.0.1.

## Результат
- Пересборка клиента не нужна; manifest подхватится при следующей проверке обновлений
