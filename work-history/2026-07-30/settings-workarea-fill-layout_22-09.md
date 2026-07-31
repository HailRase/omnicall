# Settings work-area fill без OS maximize

**Дата:** 2026-07-30 22:09
**Статус:** выполнено
**Коммит:** `68e7c705`

## Где
- `src/main/shellWindow/ShellWindowController.ts`
- `src/domain/platform/ShellWindowLayout.ts`
- `src/application/services/platform/ShellWindowLayoutService.ts`
- `docs/softphone/Feature-Registry.md`, `UI-Architecture.md`, `Icon-Registry.md`

## Что
- Maximize в Settings переведён на layout-owned `setBounds(workArea)` (как video-fullscreen).
- OS `maximize`/`unmaximize` больше не вызываются; `maximizable` всегда false.
- Закрытие Settings из work-area fill — один шаг в compact bottom-right.
- Все layout-переходы мгновенные (`0ms`).
- Обновлены F-016 contract, UI-Architecture, Icon-Registry и тесты.

## Зачем
- Убрать кроссплатформенный скачок в центр из-за OS restore-rect при закрытии развёрнутых Settings.

## Результат
- Targeted tests: 40/40 PASS (`ShellWindowController`, `ShellWindowLayout`, `ShellWindowLayoutService`, hooks/controls).
- `npm run registry:check`: PASS.
