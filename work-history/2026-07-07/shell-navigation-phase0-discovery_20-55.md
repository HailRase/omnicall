# Shell Navigation Phase 0 — Discovery

**Дата:** 2026-07-07 20:55
**Статус:** выполнено
**Коммит:** —

## Где
- `docs/softphone/handoffs/Shell-Navigation-Contacts-History-Master-Agent-Prompt.md`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `src/renderer/hooks/useOverlayShell.ts`
- `src/renderer/widgets/SoftphoneLayout/`

## Что
- Прочитан Mandatory Read Order (MASTER_SYSTEM_PROMPT, STATUS, Architecture, UI-Architecture, UX Blueprint, Feature Registry, Legacy Coverage, Implementation-Roadmap, P11 handoffs).
- Инвентаризированы владельцы shell, overlays, settings, calls, notifications; call history и contacts в коде отсутствуют.
- Зафиксированы F-013 (planned), LF-052–054; для contacts предложен новый F-025 (до реализации — согласование).
- Тестовый baseline: 1510 passed, 1 skipped (`npm run test`).
- Рекомендация: **Option A** (typed `ShellRoute` + `useShellNavigation`), без router dependency на Phase 1.
- Зафиксированы риски remount зон, расхождение docs (PanelNav/MainPanelZone) с кодом (4 зоны).

## Зачем
- Phase 0 master prompt: safety plan перед навигационным расширением без production-кода.

## Результат
- Discovery завершён; ожидается одобрение пользователя на Option A и переход к Phase 1.
- Проверки: `npm run test` — 1510 passed, 1 skipped.
