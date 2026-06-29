# cardActive и кнопка удаления dialpad

**Дата:** 2026-06-29 15:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallSessionCard.module.css`
- `src/renderer/components/dialpad/Dialpad.tsx`
- `src/renderer/components/dialpad/Dialpad.module.css`
- `src/renderer/components/dialpad/Dialpad.test.tsx`

## Что
- `.cardActive` / `.compactActive`: только фон `--color-bg-surface-alt`, без border/box-shadow
- Кнопка delete: `border: none`, `cursor: pointer`, long-press clear 500 мс
- Тест long-press обновлён под 500 мс

## Зачем
Активная сессия — тонкий фоновый акцент; кнопка очистки — чище и быстрее по UX.

## Результат
Тесты dialpad + CallSessionCard — OK; lint — OK.
