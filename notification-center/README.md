# Notification Center Implementation Plan

- Purpose: executable plan for **F-034 Notification Center** — unified preferences, policy, and Settings hub on top of existing LF-060 toasts and F-029 journal.
- Branch: `feature/notification-center`; primary bounded context: **Settings**; related: Telephony, Operator, Integration, Headset, Media.
- Continue by reading `PROGRESS.md`, then execute the first non-done WU in `10-WORK-UNITS.md`.
- Inputs: locked product decisions in this folder, repository architecture canons, ADR-AF-007, ADR-0013, and discovery of the current capture/toast stack.
- Outputs: WU-scoped implementation, tests, canonical documentation sync, and review gates.
- Compatibility law: every behavior that works today must keep working after each WU; defaults must preserve current popup/journal/raise semantics. Improvements are additive, never silent downgrades.

## Plan map

- [`00-PRODUCT-SPEC.md`](./00-PRODUCT-SPEC.md) — locked product behavior.
- [`01-ARCHITECTURE.md`](./01-ARCHITECTURE.md) — contexts, layers, capture policy, ports, composition.
- [`02-DATA-MODEL.md`](./02-DATA-MODEL.md) — preferences schema, modules, migration.
- [`03-POLICY-AND-CHANNELS.md`](./03-POLICY-AND-CHANNELS.md) — interrupt classes, delivery channels, raise/OS rules.
- [`04-CAPTURE-AND-PRESENTATION.md`](./04-CAPTURE-AND-PRESENTATION.md) — capture sink, toast presentation, tagging discipline.
- [`05-UI-UX.md`](./05-UI-UX.md) — Settings Notification Center screens, states, UI Kit, i18n.
- [`06-PERSISTENCE-EXPORT.md`](./06-PERSISTENCE-EXPORT.md) — profile persistence and F-030 portability.
- [`07-SECURITY-ISOLATION.md`](./07-SECURITY-ISOLATION.md) — redaction, IPC, focus-steal, SDK-hide.
- [`08-TESTING.md`](./08-TESTING.md) — verification matrix and commands.
- [`09-DOCUMENTATION-SYNC.md`](./09-DOCUMENTATION-SYNC.md) — canonical documentation obligations.
- [`10-WORK-UNITS.md`](./10-WORK-UNITS.md) — ordered executable WUs.
- [`11-ACCEPTANCE.md`](./11-ACCEPTANCE.md) — product and non-regression gate.
- [`12-RISKS-NONGOALS.md`](./12-RISKS-NONGOALS.md) — risks, mitigations, and exclusions.
- [`13-AUDIT-REMEDIATION.md`](./13-AUDIT-REMEDIATION.md) — post-WU-10 audit hardening (fail-open, catalog, closable).
- [`PROGRESS.md`](./PROGRESS.md) — machine-readable WU status.
- [`AGENT-CONTINUATION.md`](./AGENT-CONTINUATION.md) — exact continuation protocol.

## Relationship to existing features

| Feature | Role after F-034 |
| --- | --- |
| LF-060 / F-016 toast viewport | Remains the sole in-app toast renderer; appearance prefs move under Notification Center |
| F-029 journal + ADR-AF-007 | Remains always-on capture history; prefs never disable journal |
| ADR-0013 shell raise | Remains the only critical attention raise path; F-034 may add optional `errors_only` raise, never broad toast→raise |
| Call DND | Unrelated telephony auto-reject; must not be conflated with notification quiet prefs |

## Explicit non-overlap

- Does not replace incoming-call modal/banner with toast.
- Does not change SIP/OCP/SDK wire protocols, Call Engine, headset HID, or External Services HTTP.
- Does not implement a second toast stack or revive LF-059 legacy notification UI.
