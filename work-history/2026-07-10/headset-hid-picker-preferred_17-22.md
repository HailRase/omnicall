# T-017 Electron HID picker preferred id (EXT-11)

**Дата:** 2026-07-10 17:22
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/headset/pickSelectHidDevice.ts`
- `src/main/headset/preferredSoftphoneHidDeviceStore.ts`
- `src/main/index.ts` (`select-hid-device`)
- `src/shared/ipc/HeadsetPreferredDeviceContract.ts`, `IpcChannels.ts`, `PreloadApi.ts`
- `src/preload/index.ts`, `src/renderer/hooks/useSettingsActions.ts`

## Что
- `pickSelectHidDeviceId` выбирает preferred softphone id (`vendor:product:name`) из Electron deviceList
- IPC `headset:set-preferred-device-id` синхронизирует preferred из renderer в main
- Fallback на первый device, если preferred нет в списке

## Зачем
- При нескольких HID-устройствах picker не цепляет «первое попавшееся», а предпочитает запомненную гарнитуру

## Результат
- Unit tests + typecheck + lint green
- Трек P10 Headset Extensibility (EXT-1–11) закрыт
