# Auth Flow Refactoring — WU-00 (ADRs + freeze)

**Дата:** 2026-07-16 15:12
**Статус:** выполнено
**Коммит:** —

## Где
- `auth-flow/auth-flow-refactoring.md`
- `docs/softphone/adr/ADR-AF-001-saved-draft-profile-lifecycle.md`
- `docs/softphone/adr/ADR-AF-002-ocp-transport-auth-dual-fsm.md`
- `docs/softphone/adr/ADR-AF-003-account-sole-sign-in-surface.md`
- `docs/softphone/adr/ADR-AF-004-settings-authorization-gate.md`
- `docs/softphone/handoffs/P11-Auth-Flow-Refactoring-Handoff.md`
- `docs/softphone/Feature-Registry.md`, `STATUS.md`, `TASK-QUEUE.md`

## Что
- Принят контракт WU-00: четыре ADR (draft lifecycle, dual FSM, Account sole sign-in, Settings gate).
- Обновлены acceptance criteria F-001 / F-014 / F-016 / F-023 / F-024 / F-028 (F-028 → corrective in progress).
- Создан corrective handoff с замороженными UX-состояниями, recovery actions и test IDs.
- STATUS / TASK-QUEUE (T-033) указывают на план; следующий unit — WU-01.

## Зачем
Зафиксировать архитектуру и критерии до кода, чтобы WU-01+ не ломали SIP-only, secret boundary и avatar-only logout.

## Результат
WU-00 закрыт. Production code не менялся. Staging smoke не заявлялся. Следующий шаг: `/logic` → WU-01.
