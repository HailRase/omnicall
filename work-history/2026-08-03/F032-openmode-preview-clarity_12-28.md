# F-032 openMode preview clarity

**Дата:** 2026-08-03 12:28
**Статус:** выполнено
**Коммит:** `ae968b7`

## Где
- `src/renderer/components/settings/external-applications/OpenModeSchematics.tsx`
- `src/renderer/components/settings/external-applications/OpenModeChoiceCards.tsx`
- `src/renderer/components/settings/external-applications/OpenModeChoiceCards.module.css`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`

## Что
- Desktop-сцена вместо abstract wireframe: taskbar, softphone, стрелка, целевое окно
- Подписи на схеме (Софтфон / Окно OmniCall / Браузер / https://…) через i18n
- Браузер визуально отличим (вкладки + address bar); app window — title bar OmniCall
- CSS-анимация появления target + pulse стрелки на hover/selected; `prefers-reduced-motion`
- Уточнены описания режимов; layout radio cards не менялся

## Зачем
- Оператор сразу понимает разницу «окно OmniCall рядом» vs «системный браузер»

## Результат
- `npm run i18n:check` — passed
- `npx vitest run …/ExternalApplicationsPanel.test.tsx` — 5 passed
