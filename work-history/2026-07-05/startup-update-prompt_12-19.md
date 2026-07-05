# F-020: фоновая проверка обновлений при старте

**Дата:** 2026-07-05 12:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useAppUpdate.ts`
- `src/renderer/components/updates/UpdateAvailableBanner.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/i18n/messages.ts`
- `docs/softphone/Feature-Registry.md`
- `guides/Manual-Update-Manifest.md`, `guides/GitHub-Releases-Update-Guide.md`

## Что
- Добавлена однократная фоновая проверка manifest при монтировании ready shell (Strict Mode safe)
- Неблокирующий баннер с версией, «Скачать», «Позже» и опционально «Что нового»
- Расширен `useAppUpdate`: `showUpdatePrompt`, dismiss на сессию, release notes через существующий open URL flow
- i18n ключи `updates.prompt.*` для ru/en/fr/de
- Тесты: `useAppUpdate.test.ts`, `UpdateAvailableBanner.test.tsx`
- Обновлены F-020 registry и guides; `npm run release:sync-manifest`

## Зачем
Уведомлять пользователя о новой версии при запуске без auto-install и без изменения ручного flow в Настройках.

## Результат
- `npm run release:preflight` — PASS (1045 tests)
- `npm run typecheck`, `npm run i18n:check` — PASS
- Установка остаётся ручной; electron-updater не добавлен
