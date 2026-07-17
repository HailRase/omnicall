# Равная ширина табов аккаунта

**Дата:** 2026-07-17 09:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/account/AccountPanel.module.css`
- `src/renderer/components/account/AccountPanel.module.css.d.ts`

## Что
- Таб-лист режимов SIP/OCP переведён в двухколоночную grid-сетку.
- Оба таба растягиваются на одинаковую ширину.
- Обновлены типы CSS Module.
- UI-каталог пересобран.

## Зачем
- Сделать визуальное пространство табов «Только SIP» и «Модуль OCP» одинаковым.

## Результат
- `AccountPanel.test.tsx` — 12/12.
- `npm run typecheck` — успешно.
- `npm run lint` — успешно.
- `npm run ui:catalog` — успешно.
