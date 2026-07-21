# IconButton visual parity (SDK trusted sites)

**Дата:** 2026-07-21 22:31
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/icon-button/IconButton.module.css`
- `src/renderer/components/settings/panels/SdkModuleSettingsOriginAddressEditor.tsx`
- `src/renderer/components/icons/IconControlButton.module.css`
- `src/renderer/components/settings/SettingsPanel.module.css`
- `docs/ui-kit/VISUAL-SPEC.md`
- `docs/softphone/Feature-Registry.md` (F-011, F-016)

## Что
- IconButton: круглая форма, soft tint вместо серых квадратов
- SDK Trusted sites address edit/save/cancel: переход с голого `IconControlButton` на UI Kit `IconButton` (`ghost` / `sm`)
- `IconControlButton`: сброс нативного chrome браузера (transparent, no border, radius-full)
- Settings close-слот упрощён; VISUAL-SPEC + registry evidence

## Зачем
Убрать серые квадратные кнопки edit/save/cancel в настройках Axatalk SDK → Доверенные сайты.

## Результат
- `SdkModuleSettingsCard.test.tsx` + `IconButton.test.tsx` — PASS (20)
- Ранее: полный `test` / `lint` / `typecheck` — PASS
