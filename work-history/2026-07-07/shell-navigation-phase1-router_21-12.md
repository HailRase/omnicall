# Shell Navigation Phase 1 — Hash Router Foundation

**Дата:** 2026-07-07 21:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/navigation/*`
- `src/renderer/App.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `docs/softphone/UI-Architecture.md`
- `package.json` — `react-router-dom`

## Что
- Option B: `HashRouter` + `ShellNavigationController` с parent layout route (4 зоны не remount).
- Маршруты: `/`, `/history`, `/contacts`, `/contacts/:contactId`, `/contacts/:contactId/edit`, fallback `*` → dialpad.
- `useShellNavigation`, parse/validate contactId, guards (history sidebar vs fullPanel).
- `ShellRoutePanelOutlet` — Phase 1 marker в overlay layer без product UI.
- 17 новых тестов navigation; обновлён UI-Architecture.md.

## Зачем
- Phase 1 master prompt: navigation foundation без изменений telephony Domain/Application.

## Результат
- `npm run test` — 1536 passed, 1 skipped
- `npm run lint` / `npm run typecheck` — green
- `npm run i18n:check` — pre-existing fail в FormField.tsx (не в scope)
- Намеренно не сделано: history/contacts UI, settings route alignment (Phase 5), Feature Registry
