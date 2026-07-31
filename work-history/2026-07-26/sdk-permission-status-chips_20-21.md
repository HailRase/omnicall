# SDK permission status chips

**Дата:** 2026-07-26 20:21
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/panels/SdkModuleSettingsOriginMatrix.tsx`
- `src/renderer/components/settings/panels/SdkModuleSettingsCard.module.css`
- `src/renderer/components/icons/iconCatalog.ts`
- `docs/softphone/Icon-Registry.md`

## Что
- Select «Allowed/Denied» заменён на статус-чип: зелёная галочка / красный крестик + подпись
- Клик по чипу переключает permission; a11y через `aria-pressed` + label
- Иконки `sdk.permission.allowed` / `sdk.permission.denied` в catalog + registry
- Обновлён тест карточки SDK settings

## Зачем
- Сделать состояние каждого разрешения сайта мгновенно читаемым и визуально аккуратным

## Результат
- `npx vitest run …/SdkModuleSettingsCard.test.tsx` — 7 passed
