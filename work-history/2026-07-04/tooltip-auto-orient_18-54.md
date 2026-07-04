# Tooltip auto-orient (Floating UI)

**Дата:** 2026-07-04 18:54
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/icons/IconTooltip.tsx`
- `src/renderer/components/icons/IconTooltip.module.css`
- `src/renderer/components/icons/IconTooltip.test.tsx`
- `package.json` (`@floating-ui/react-dom`)
- `docs/softphone/Feature-Registry.md` (F-016)
- `docs/softphone/UI-Design-System.md`

## Что
- Подключён `@floating-ui/react-dom` для viewport-aware позиционирования tooltip
- Tooltip рендерится через portal в `document.body` — не обрезается `overflow: hidden`
- Middleware `flip` + `shift` + `autoUpdate` для автоориентации и слежения за anchor
- Сохранены задержка 1s, `prefers-reduced-motion`, токены light/dark
- Добавлен тест portal-рендеринга; обновлены Feature Registry и UI Design System

## Зачем
Tooltip на иконках уходили за границы окна Electron и обрезались контейнерами с `overflow: hidden`.

## Результат
- `npm run test` — 1031 passed, 1 skipped
- `npm run lint` — green
- `npm run typecheck` — green
- `npm run ui:catalog` — ok
