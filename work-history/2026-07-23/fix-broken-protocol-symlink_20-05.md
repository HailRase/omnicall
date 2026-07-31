# Исправление сломанного symlink @axata/axatalk-protocol

**Дата:** 2026-07-23 20:05
**Статус:** выполнено
**Коммит:** —

## Где
- 
ode_modules/@axata/axatalk-protocol (junction)
- src/shared/ipc/SdkBrokerContract.ts (потребитель импорта)
- electron.vite.config.ts (preload без externalizeDepsPlugin)

## Что
- Обнаружен битый junction: цель D:\Axata\softphone-electron\... вместо актуального D:\Axata\AXATALK_PROJECTS\softphone-electron\...
- Пересоздана ссылка через 
pm install "@axata/axatalk-protocol@file:axatalk-sdk/packages/protocol"
- package.json / package-lock.json не менялись; версии не понижались
- Проверена сборка 
px electron-vite build (main + preload + renderer)

## Зачем
- 
pm run dev падал на preload: Rollup не резолвил @axata/axatalk-protocol

## Результат
- Junction указывает на корректный путь; ESM-импорт и electron-vite build успешны
