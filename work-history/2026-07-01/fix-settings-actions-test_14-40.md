# Fix useSettingsActions test mock

**Дата:** 2026-07-01 14:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/hooks/useSettingsActions.test.ts`

## Что
- Добавлен `beforeEach`/`afterEach` с моком `window.softphone.setNativeTheme`
- Импортирован тип `SoftphonePreloadApi` для типизированного spy
- Устранены unhandled rejection при вызове `syncNativeTheme` в хуке

## Зачем
После добавления синхронизации нативной темы Electron хук вызывает `window.softphone.setNativeTheme`, а тест не мокал preload API — падал CI.

## Результат
- `npm run test -- useSettingsActions.test.ts` — 2/2 passed
- `npm run test` — 937 passed, 1 skipped
