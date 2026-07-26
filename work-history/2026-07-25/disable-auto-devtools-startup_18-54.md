# Отключение автозапуска DevTools при старте

**Дата:** 2026-07-25 18:54
**Статус:** выполнено
**Коммит:** `3de68b1`

## Где
- `src/main/index.ts`

## Что
- Убран вызов `openDevTools({ mode: "detach" })` при создании главного окна в dev-режиме
- Сохранены `devTools: isMainProcessDevMode()` в webPreferences и шорткаты через `installDeveloperWebContentsShortcuts` (F12 / Ctrl+Shift+I)

## Зачем
- При старте приложения DevTools больше не открывается автоматически

## Результат
- В dev DevTools доступны вручную; автооткрытие при launch отключено
