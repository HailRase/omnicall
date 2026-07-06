# Settings module — UI Kit Switch migration

**Дата:** 2026-07-06 22:49
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/` — General, Sessions, SystemState, CodecPreferencesSortableList
- `src/renderer/components/account/AccountPanel.tsx` — save profile toggle (settings embed)
- `src/renderer/components/settings/SettingsForm.module.css` — удалены legacy switch styles
- `src/renderer/test/setupJsdomRadix.ts` — polyfill для Radix в jsdom

## Что
- Все checkbox/toggle в модуле настроек заменены на UI Kit `Switch` с `onCheckedChange`
- Codec preferences: checkbox → Switch в строках списка
- AccountPanel «Сохранить профиль» — Switch (используется в SettingsAccountPanel)
- Удалены `.switch`, `.switch-input`, `.switch-slider`, `.checkbox` legacy CSS
- Тесты: `data-state` вместо `toBeChecked`; `setupJsdomRadix` для account/panel tests

## Зачем
- Единый UI Kit baseline для boolean-настроек; Radix switch semantics и a11y.

## Результат
- `npm run test -- --run src/renderer/components/settings` — 46 passed
- `npm run lint` — ok
- `npm run typecheck` — ok
