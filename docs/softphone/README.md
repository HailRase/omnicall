# Enterprise Softphone Platform Documentation

- Purpose: define architecture, rules, and agent workflows for the rewrite.
- Inputs: audit findings, product requirements, telephony constraints.
- Outputs: project constitution, Cursor rules, reusable agent skills.
- Scope: Electron desktop softphone; **OCP plugin DEFERRED** (see `OCP-PLUGIN-BACKLOG.md`).
- Priority: call reliability, replaceability, observability, testability.
- Rule/Skill split: rules are mandatory; skills are task procedures.

## Document Map

| Type | Path | Purpose |
|------|------|---------|
| DOCUMENT | `MASTER_SYSTEM_PROMPT.md` | Product mission and non-negotiable goals |
| DOCUMENT | `OCP-PLUGIN-BACKLOG.md` | **OCP plugin DEFERRED** — agents read before Operator work |
| DOCUMENT | `adr/ADR-0002-defer-ocp-plugin.md` | Product decision to defer OCP to far backlog |
| DOCUMENT | `Architecture-Constitution.md` | System layers, contexts, and boundaries |
| DOCUMENT | `Engineering-Principles.md` | Decision-making principles |
| DOCUMENT | `Feature-Registry.md` | Feature ownership and acceptance registry |
| DOCUMENT | `Legacy-Feature-Coverage.md` | Full LF-001..LF-090 legacy parity registry |
| DOCUMENT | `Implementation-Roadmap.md` | Ordered phase-by-phase implementation plan |
| DOCUMENT | `UX-UI-Design-Blueprint.md` | Electron + React UX/UI state design |
| DOCUMENT | `UI-Architecture.md` | Renderer layers, hooks, shells, dumb-UI contract |
| DOCUMENT | `Agent-Prompts.md` | Reusable prompts for future implementation agents |
| DOCUMENT | `adr/ADR-0000-template.md` | Architecture decision record template |
| RULE | `.cursor/rules/architecture.mdc` | Enforce dependency and layer boundaries |
| RULE | `.cursor/rules/ai-agent-behavior.mdc` | Enforce agent work protocol |
| RULE | `.cursor/rules/feature-registry.mdc` | Enforce feature-first implementation |
| RULE | `.cursor/rules/legacy-feature-coverage.mdc` | Enforce LF-001..LF-090 parity tracking |
| RULE | `.cursor/rules/implementation-roadmap.mdc` | Enforce roadmap order and phase gates |
| RULE | `.cursor/rules/typescript-react-electron.mdc` | Enforce stack-specific safety rules |
| RULE | `.cursor/rules/testing-observability.mdc` | Enforce tests, logs, and diagnostics |
| RULE | `.cursor/rules/ux-ui-electron-react.mdc` | Enforce UX/UI state design before components; read `UI-Architecture.md` |
| SKILL | `.cursor/skills/softphone-architecture-review/SKILL.md` | Review architecture before changes |
| SKILL | `.cursor/skills/feature-slice-design/SKILL.md` | Design a vertical feature slice |
| SKILL | `.cursor/skills/telephony-flow-review/SKILL.md` | Review call lifecycle behavior |
| SKILL | `.cursor/skills/integration-contract-review/SKILL.md` | Review OCP/window/IPC contracts |
| SKILL | `.cursor/skills/legacy-feature-migration/SKILL.md` | Migrate legacy features without parity loss |
| SKILL | `.cursor/skills/implementation-phase-planning/SKILL.md` | Plan agent work for a roadmap phase |
| SKILL | `.cursor/skills/ux-ui-flow-design/SKILL.md` | Design UX/UI states and flows before React code |

## Audit-Derived Priorities

1. Replace the old provider-centered model with use-case-centered architecture.
2. Keep SIP, OCP, headset vendors, storage, and Electron outside the Domain layer.
3. Replace raw `CustomEvent` and `window` mutation with typed integration adapters.
4. Model calls through explicit events and finite state transitions.
5. Treat OCP as an optional plugin, not a core dependency (**product: DEFERRED** per ADR-0002).
6. Start implementation with a narrow telephony vertical slice before JsSIP integration.
7. Track all legacy features through `LF-001` to `LF-090`.
8. Follow the roadmap phase order unless an ADR approves a deviation.
9. Design UX/UI states before writing Electron or React components.
