# Баннер обновления — top overlay (F-020)

**Дата:** 2026-07-06 16:26
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/updates/UpdateAvailableBanner.tsx`
- `src/renderer/components/updates/UpdateAvailableBanner.module.css`
- `src/renderer/components/updates/UpdateAvailableBanner.stories.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `docs/softphone/UI-Component-Catalog.md`

## Что
- Компактная полоса в header заменена на плавающую карточку-overlay сверху по центру
- Иконка `updates.available`, заголовок, текст версии, кнопки «Скачать» и «Позже»
- Компонент перенесён в слой `overlays` SoftphoneLayout (не сдвигает header)
- Storybook: `Updates/UpdateAvailableBanner` — Light, Dark, WithoutVersion
- Обновлены тесты и UI Component Catalog

## Зачем
Ненавязчивое уведомление об обновлении без полосы в header; соответствие F-020 non-blocking overlay.

## Результат
- `npm run test` (UpdateAvailableBanner) — OK
- `npm run lint`, `npm run typecheck`, `npm run ui:catalog` — OK
