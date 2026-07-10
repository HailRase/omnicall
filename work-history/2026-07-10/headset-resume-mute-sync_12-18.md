# Headset resume LED and mute sync

**Дата:** 2026-07-10 12:18
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/HeadsetSessionOrchestrator.ts`
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/headset/HeadsetSessionOrchestrator.test.ts`

## Что
- При skip reconcile (device→app + pending intent) `lastSnapshot` больше не обновляется
- После clear intent — retry LED (answer после resume, setMute после mute с гарнитуры)
- Hold guard timer сбрасывается при успешном match intent (не блокирует кнопки 2с)
- Регрессионные тесты: device resume LED + device mute LED catch-up

## Зачем
- Resume с гарнитуры оставлял ring/hold LED и «мёртвые» кнопки
- Mute с гарнитуры не догонял app→device setMute / edge detector → рассинхрон с UI

## Результат
- vitest `src/application/headset`: 50 passed
