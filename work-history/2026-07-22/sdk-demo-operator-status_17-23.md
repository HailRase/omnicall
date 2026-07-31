# Исправление operator changeStatus в sdk-demo

**Дата:** 2026-07-22 17:23
**Статус:** выполнено
**Коммит:** —

## Где
- `C:/Users/User/Desktop/ELECTRON/sdk-demo/app.mjs`
- `C:/Users/User/Desktop/ELECTRON/sdk-demo/index.html`
- `C:/Users/User/Desktop/ELECTRON/sdk-demo/CHANGELOG-DEMO.md`
- `C:/Users/User/Desktop/ELECTRON/sdk-demo/HOW-TO-RU.md`

## Что
- Ready больше не отправляет `reasonId` из поля break (`invalid_payload` при kind mismatch)
- Break требует `reasonId`; пустое поле → auto из `getReasons` (`kind: break`)
- После `accepted` — poll snapshot до `operator.status === target` (~5 с)
- Один auto-retry на `stale_state` со свежим revision
- Snapshot показывает `reasonId` / `reasonLabelKey`; refresh на operator events

## Зачем
- Demo отправлял неверный payload и сразу читал snapshot до подтверждения OCP, из‑за чего казалось, что статус «не меняется»

## Результат
- Правки только в соседнем `sdk-demo` (вне softphone repo)
- Перезагрузить страницу demo → вкладка Оператор → getReasons → changeStatus → break
