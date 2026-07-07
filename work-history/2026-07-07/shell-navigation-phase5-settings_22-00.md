# Shell Navigation Phase 5 — Settings Route Alignment (F-016)

**Дата:** 2026-07-07 22:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/navigation/{shellRouteModel,parseShellRoute,shellRoutePaths,ShellNavigationController,settingsNavigationState}.ts(x)`
- `src/renderer/hooks/useOverlayShell.ts`
- `src/renderer/navigation/useShellNavigation.ts` (`goBackSafe`)
- `docs/softphone/Feature-Registry.md` (F-016)

## Что
- Маршруты `#/settings` и `#/settings/:sectionId` открывают тот же fullscreen overlay.
- `useOverlayShell` переведён с локального state на route-driven модель.
- Валидация section id через `isSettingsSectionId`; невалидный → `general`.
- Закрытие: `settingsReturnTo` в router state → `navigate(-1)` → dialpad fallback.
- Смена раздела в sidebar: `replace` без лишних history entries.
- 12 новых/обновлённых navigation/overlay тестов.

## Зачем
- Phase 5 master prompt: addressable settings без нарушения call-center overlay rule.

## Результат
- `npm run test` — 1566 passed, 1 skipped
- `npm run lint` / `npm run typecheck` / `npm run ui:catalog` — PASS
- `npm run i18n:check` — FAIL (pre-existing `FormField.tsx`, вне scope)
- Не сделано: Phase 6 regression hardening
