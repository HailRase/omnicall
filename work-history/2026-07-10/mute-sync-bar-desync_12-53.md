# Mute sync bar desync fix

**Дата:** 2026-07-10 12:53
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/headset/HeadsetSyncQueue.ts`
- `src/application/headset/HeadsetSyncQueue.test.ts`
- `src/application/headset/HeadsetSessionOrchestrator.test.ts`

## Что
- Разделил mute intent timeout (2s) и firmware echo (300ms) — echo больше не сбрасывает in-flight intent
- `beginMuteSessionSync` блокируется только pending intent, не echo-таймером
- После match: короткий echo + UI busy ≥250ms (кнопка mute disabled на bar)
- Добавлены unit-тесты на begin-after-echo, intent persistence, UI busy settle

## Зачем
- Убрать рассинхрон mic на гарнитуре vs session controls bar и вернуть быстрый toggle с кратким disabled

## Результат
- `npx vitest run src/application/headset src/application/projections/headset` — 61 passed
- Нужен smoke: mute с гарнитуры и с bar — иконка и disabled должны совпадать с первого нажатия
