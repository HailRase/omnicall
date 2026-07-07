# Политика resize окна shell (F-016)

**Дата:** 2026-07-07 16:07
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/platform/ShellWindowLayout.ts`
- `src/main/shellWindow/ShellWindowController.ts`
- `src/main/index.ts`
- `docs/softphone/Feature-Registry.md`

## Что
- Добавлена domain-функция `resolveShellWindowResizable`: resize только в режиме `settings`
- `ShellWindowController` применяет политику при старте (compact), при открытии и закрытии настроек
- `BrowserWindow` создаётся с `resizable: false` по умолчанию
- Snapshot compact-размеров (`width` + `height`) при входе в настройки; при выходе восстанавливаются оба измерения
- Unit-тесты domain и `ShellWindowController` (включая restore height после resize в settings)
- Обновлены acceptance criteria F-016 в Feature Registry

## Зачем
Запретить изменение размера окна в режиме дисплея; разрешить только в настройках. При выходе из настроек восстанавливать исходные compact width и height.

## Результат
- `npm run test` — 1515 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
