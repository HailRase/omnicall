# P10 Headset Integration Architecture

**Дата:** 2026-07-09 20:51
**Статус:** выполнено
**Коммит:** `9c0dc8c` (uncommitted working tree)

## Где
- `src/domain/headset/`, `src/ports/headset/`
- `src/application/headset/`, `src/application/services/headset/`
- `src/adapters/headset/webhid/`, `src/adapters/mock/MockHeadsetGateway.ts`
- `src/renderer/components/settings/panels/SettingsHeadsetPanel.tsx`
- `docs/softphone/adr/ADR-0007-headset-web-hid.md`
- `docs/softphone/handoffs/P10-Headset-Integration-Handoff.md`

## Что
- WU1: домен, порт `HeadsetGateway`, mock-адаптер, orchestrator/snapshot, settings schema v4, ADR-0007
- WU2: `WebHidHeadsetAdapter`, vendor profiles Jabra/Poly, Electron HID permissions, bootstrap wiring
- WU3: live orchestrator ↔ facade Use Cases, LED reconcile, `headsetSyncBusy` блокировка UI
- WU4: панель «Гарнитуры», i18n (5 локалей), Storybook/tests, registry + STATUS + legacy evidence
- Исправлены fixtures тестов/stories, lint, typecheck, i18n interpolation для `deviceLabel`

## Зачем
Опциональная расширяемая интеграция USB-гарнитур через Web HID без SDK и без обхода Call Engine.

## Результат
- `npm run typecheck` — OK
- `npm run test` — 1576 passed (с `SettingsHeadsetPanel.test.tsx`)
- `npm run lint` — OK
- `npm run i18n:check` — OK
- По умолчанию `headsetEnabled=false`; ручной smoke на устройстве — по handoff
