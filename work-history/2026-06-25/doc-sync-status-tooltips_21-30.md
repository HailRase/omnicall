# Doc sync: STATUS + tooltips done

**Дата:** 2026-06-25 21:30
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/STATUS.md`, `Implementation-Roadmap.md`, `Feature-Registry.md`
- `docs/softphone/real-integration/PROGRESS.md`, `MASTER-AGENT-PROMPT.md`, `00-SNAPSHOT.md`
- `docs/softphone/handoffs/README.md`, `Cursor-Agents-Guide.md`
- `.cursor/rules/ux-ui-electron-react.mdc`, `.cursor/commands/ui.md`, `logic.md`

## Что
- Test count 694 → **697** во всех live-артефактах
- T-001/T-002 убраны из «deferred»; next work → F-008 DTMF, P10
- Roadmap: секция completed TASK-QUEUE (T-001, T-002)
- Feature Registry F-016: убрано противоречие «tooltips deferred»
- ux-ui-electron-react.mdc: `IconControlButton` + `IconTooltip` как стандарт

## Зачем
Закрыть Low doc drift после gate review T-001 icon tooltips.

## Результат
Live-документация синхронизирована с TASK-QUEUE и фактическим состоянием кода.
