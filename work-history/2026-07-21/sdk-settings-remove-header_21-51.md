# SDK Settings: убрана шапка title/description

**Дата:** 2026-07-21 21:51
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SdkModuleSettingsCard.tsx`

## Что
- Удалены видимые «Axatalk SDK» и описание из шапки карточки
- Для a11y оставлен `aria-label` с title

## Зачем
- Убрать дублирующий preamble над вкладками

## Результат
- `SdkModuleSettingsCard.test.tsx` 7/7 PASS
