# Env local real mode

**Дата:** 2026-07-20 10:31
**Статус:** выполнено
**Коммит:** —

## Где
- `.env.local` (repo root, gitignored)

## Что
- Создан `.env.local` с `VITE_ADAPTER_MODE=real` и dev SBC credentials из `docs/softphone/real-integration/env.local.example`
- Файл покрыт `.gitignore` (`.env.*`, исключение только для `.env.production`)

## Зачем
Включить real-адаптеры (OCP HTTP/WS, JsSIP) для `npm run dev` на Mac без query `?adapters=real`.

## Результат
- Нужен перезапуск `npm run dev`, чтобы Vite подхватил env
- После рестарта OCP auth должен слать `https://…/proxy/authenticate` и `wss://…/ws` в DevTools Network
