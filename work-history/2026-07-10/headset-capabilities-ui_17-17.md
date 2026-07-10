# T-018 Headset capabilities UI (EXT-9)

**Дата:** 2026-07-10 17:17
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/headset/headsetConnectionProjection.ts`
- `src/domain/headset/events/headsetEvents.ts`
- `src/application/services/headset/HeadsetIntegrationService.ts`
- `src/renderer/components/settings/panels/SettingsHeadsetPanel.tsx`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`

## Что
- Projection: `capabilities` на connect, clear на disconnect/USB unplug
- `HeadsetConnected` несёт snapshot capabilities с gateway
- Settings: строка «Кнопки: …» при подключённой гарнитуре
- i18n ru/en/fr/de/bg

## Зачем
- Показать оператору реальные capabilities подключённого устройства без vendor if в UI

## Результат
- Tests + i18n:check + typecheck + lint green
- Next optional: EXT-11 Electron HID picker preferred id
