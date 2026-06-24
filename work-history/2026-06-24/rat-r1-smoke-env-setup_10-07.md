# RAT R1 — .env.local и подготовка manual smoke

**Дата:** 2026-06-24 10:07
**Статус:** выполнено
**Коммит:** —

## Где
- `.env.local` (repo root, gitignored)
- `docs/softphone/real-integration/SMOKE-CHECKLIST.md`

## Что
- Создан `.env.local` с учётными данными dev SBC
- Registrar исправлен: `5063` — SIP, WebSocket на `wss://onedemoserver.online:443/ws`
- `VITE_ADAPTER_MODE=real` для Electron smoke без query-параметра
- Перезапущен `npm run dev`
- Подготовлена пошаговая инструкция R1 manual smoke

## Зачем
Провести R1 registration smoke на реальном SBC по чеклисту RAT step 02.

## Результат
- Node integration test: Connection Error (JsSIP в vitest/node — ожидаемо; smoke в Electron)
- Dev server запущен; manual smoke — по инструкции пользователю
