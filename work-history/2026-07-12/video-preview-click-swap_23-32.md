# Video preview click swap

**Дата:** 2026-07-12 23:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallVideoSurface.tsx`
- `src/renderer/components/call/CallVideoSurface.module.css`
- `src/renderer/components/call/CallVideoSurface.test.tsx`

## Что
- Добавлен swap local/remote по клику на preview pane
- Swap реализован через перестановку bind-target для remote/local surfaces
- Drag-логика сохранена отдельно: перетаскивание preview не триггерит swap
- Добавлены стили зеркалирования для local в main (`remote-video-local`) и отключения зеркала remote в preview (`local-video-remote`)
- Обновлены тесты: swap по клику, существующие сценарии рендера/скрытия/fullscreen

## Зачем
Нужно явно переключать “я на большом экране / абонент в preview” только при нажатии, без ложного переключения при перетаскивании PiP.

## Результат
`CallVideoSurface.test` и `typecheck` — passed
