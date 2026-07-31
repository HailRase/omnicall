# Pre-auth Integrations nav fix

**Дата:** 2026-07-21 20:29
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsSidebar.tsx`
- `src/renderer/components/settings/SettingsSidebar.test.tsx`
- `docs/softphone/adr/ADR-AF-004-settings-authorization-gate.md`
- `docs/softphone/adr/ADR-0018-sdk-origin-tofu-blacklist-activate-consent.md`
- `docs/softphone/Feature-Registry.md`
- `docs/softphone/handoffs/P11-Auth-Flow-Refactoring-Handoff.md`

## Что
- Группа «Интеграции» disabled только если все дети blocked (не по первому ребёнку OCP)
- Клик по группе ведёт на первый enabled child (`integrations-sdk` pre-auth)
- Тесты: pre-auth parent enabled, SDK reachable, OCP disabled
- ADR-AF-004 / ADR-0018 / Feature Registry / handoff — зафиксирована IA parent-group wiring

## Зачем
- До авторизации оператор должен открывать Settings → Integrations → Axatalk SDK (ADR-0018), не блокируясь из‑за gated OCP Module

## Результат
- `npx vitest run SettingsSidebar.test.tsx deriveSettingsNavigationAvailability.test.ts` — 18 passed
