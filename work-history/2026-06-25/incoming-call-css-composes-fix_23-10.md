# Исправление PostCSS composes в IncomingCallActions

**Дата:** 2026-06-25 23:10
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/IncomingCallActions.module.css`

## Что
- Удалён недопустимый селектор `.buttonGroup button { composes: iconButton }`
- Стили кнопок уже задаются через `className={styles.iconButton}` в TSX

## Зачем
- Vite/PostCSS падал при dev: `composition is only allowed when selector is single :local class name`

## Результат
- `npm run build` — успешно (exit 0)
