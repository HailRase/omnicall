# UI Kit Tabs: sliding selected indicator + Account mode tabs

**Дата:** 2026-07-17 14:59
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/tabs/Tabs.tsx`
- `src/renderer/components/ui/tabs/Tabs.module.css`
- `src/renderer/components/ui/tabs/useTabsSlidingIndicator.ts`
- `src/renderer/components/account/AccountPanel.tsx`
- `docs/ui-kit/UI-KIT.md`, `docs/ui-kit/VISUAL-SPEC.md`

## Что
- В UI Kit `TabsList` добавлен opt-in `indicator="slide"`: общий thumb с токенами selected (surface / border / knob shadow) плавно переезжает между triggers
- Hover/idle остались как у profile tabs; active chrome на trigger отключается при slide (рисует thumb)
- Account mode tabs (SIP / OCP) подключены к `indicator="slide"`; локальные дублирующие selected-стили убраны
- Story `SlidingIndicator`, тест измерения thumb, reduced-motion

## Зачем
- Сделать выбранный режим на «Аккаунт» очевидным и дать переиспользуемую плавную selected-анимацию без продуктовых костылей.

## Результат
- `vitest` Tabs + AccountPanel — ok
- eslint / `tsc -p tsconfig.web.json` — ok
