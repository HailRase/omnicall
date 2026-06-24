# Revert microphone permission fixes

**Дата:** 2026-06-24 14:21
**Статус:** выполнено
**Коммит:** —

## Где
- Откат `src/main`, `src/preload`, `src/shared/ipc`, `src/renderer` (App, hooks, styles)
- Удалены `configureMediaPermissions`, `platformMicrophoneAccess`, microphone UI/hooks, `buildJsSipCallMediaOptions`
- Откат `JsSipTelephonyAdapter`, bootstrap wiring

## Что
- `git checkout` для изменённых tracked-файлов
- Удалены все новые файлы и тесты, добавленные для microphone permissions
- Удалены work-history записи по microphone fixes

## Зачем
Запрос пользователя: отменить последние фиксы, связанные с микрофоном.

## Результат
`npm run test` 533 passed; typecheck green. Код до состояния до microphone permission work.
