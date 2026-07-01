# Linux build EPERM symlink на Windows

**Дата:** 2026-07-01 14:35
**Статус:** выполнено
**Коммит:** —

## Где
- `scripts/build-linux.mjs`
- `package.json` — `desktopName`, `build:linux`
- `electron-builder.yml` — `linux.syncDesktopName`

## Что
- Диагностика: AppImage на Windows падает из‑за EPERM при создании symlink (нет Developer Mode / прав админа)
- Добавлен preflight в `build-linux.mjs` с понятным сообщением и вариантами решения
- Исправлено предупреждение electron-builder: `desktopName: axatalk`, `syncDesktopName: true`

## Зачем
- Убрать непонятный EPERM после долгой сборки и подсказать, как собрать Linux-артефакты на Windows.

## Результат
- Локально на этой машине сборка пройдёт после включения «Режим разработчика» или запуска терминала от администратора; иначе — GitHub Actions `ubuntu-latest`.
