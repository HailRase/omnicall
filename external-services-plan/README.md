# External Services Implementation Plan

- Purpose: executable plan for F-031 External Services outbound HTTP automations.
- Branch: `feature/external-services`; primary bounded context: Integration.
- Continue by reading `PROGRESS.md`, then execute the first non-done WU in `10-WORK-UNITS.md`.
- Inputs: locked stakeholder specification, repository architecture canons, and discovery evidence.
- Outputs: WU-scoped implementation, tests, canonical documentation sync, and review gates.
- Scope excludes F-011 inbound SDK, F-028 OCP control, inbound HTTP, and response-driven telephony.

## Plan map

- [`00-PRODUCT-SPEC.md`](./00-PRODUCT-SPEC.md) — locked product behavior.
- [`01-ARCHITECTURE.md`](./01-ARCHITECTURE.md) — contexts, layers, ports, services, and composition.
- [`02-DATA-MODEL.md`](./02-DATA-MODEL.md) — settings schema and immutable contracts.
- [`03-EVENTS-AND-VARIABLES.md`](./03-EVENTS-AND-VARIABLES.md) — trigger mapping, focus gate, and templates.
- [`04-EXECUTION-ENGINE.md`](./04-EXECUTION-ENGINE.md) — queue, timeout, dispatch, journal, and errors.
- [`05-UI-UX.md`](./05-UI-UX.md) — navigation, screens, states, UI Kit, and i18n.
- [`06-PERSISTENCE-EXPORT.md`](./06-PERSISTENCE-EXPORT.md) — profile persistence and portable formats.
- [`07-SECURITY-ISOLATION.md`](./07-SECURITY-ISOLATION.md) — threat boundaries and call-path isolation.
- [`08-TESTING.md`](./08-TESTING.md) — verification matrix and commands.
- [`09-DOCUMENTATION-SYNC.md`](./09-DOCUMENTATION-SYNC.md) — canonical documentation obligations.
- [`10-WORK-UNITS.md`](./10-WORK-UNITS.md) — ordered executable WUs.
- [`11-ACCEPTANCE.md`](./11-ACCEPTANCE.md) — product and non-regression gate.
- [`12-RISKS-NONGOALS.md`](./12-RISKS-NONGOALS.md) — risks, mitigations, and exclusions.
- [`PROGRESS.md`](./PROGRESS.md) — machine-readable WU status.
- [`AGENT-CONTINUATION.md`](./AGENT-CONTINUATION.md) — exact continuation protocol.
