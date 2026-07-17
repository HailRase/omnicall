# Auth Flow WU-05 — Settings gate + OCP Module edit-only

**Дата:** 2026-07-16 16:30
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/settings/deriveSettingsNavigationAvailability.ts`
- `src/application/projections/settings/deriveOcpModuleEditShell.ts`
- `src/renderer/hooks/useOverlayShell.ts`
- `src/renderer/components/settings/SettingsSidebar.tsx`
- `src/renderer/hooks/useOcpSettingsPanel.ts`
- `src/renderer/components/settings/panels/OcpModuleSettingsCard.tsx`
- `auth-flow/auth-flow-refactoring.md`, `docs/softphone/handoffs/P11-Auth-Flow-Refactoring-Handoff.md`

## Что
- Pure Application VM: pre-auth Settings availability + OCP edit-only shell flags
- Route/overlay guard: deep links и diagnostics clamp → Account до SIP-ready
- Sidebar: disabled non-Account + tooltip `settings.nav.disabled.authorizeFirst`
- OCP Module: edit-only active profile; убраны Connect/Disconnect/login picker/retry; dual status + CTA в Account
- i18n ru/en/fr/de/bg; тесты и docs (Registry / Legacy / STATUS / TASK-QUEUE)

## Зачем
Закрыть WU-05 Auth Flow: Account — единственный pre-auth Settings surface; Integrations не владеет sign-in.

## Результат
- `npm run test` — 2149 passed / 1 skipped
- `npm run typecheck` / `lint` / `i18n:check` — green
- Следующий шаг: `/preflight` → `/review` (WU-06)
