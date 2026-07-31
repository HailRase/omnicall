# Запуск sdk-demo

**Дата:** 2026-07-22 10:28
**Статус:** выполнено
**Коммит:** —

## Где
- `ELECTRON/sdk-demo/server.mjs` (вне softphone)
- `http://127.0.0.1:8765`

## Что
- Запущен disposable стенд: `node server.mjs` в `ELECTRON/sdk-demo`
- Сервер слушает `127.0.0.1:8765`
- Vendor maps указывают на `softphone/axatalk-sdk`

## Зачем
- Пользователь попросил запустить sdk-demo для живой проверки SDK против Desktop.

## Результат
- Стенд доступен: http://127.0.0.1:8765 (параллельно с `npm run dev` softphone)
