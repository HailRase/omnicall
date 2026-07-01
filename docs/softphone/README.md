# Enterprise Softphone Platform Documentation

- Purpose: architecture, rules, agent workflows, and live project status.
- Live snapshot: **`STATUS.md`** — test count, active phase, next work (update after each WU).
- OCP plugin: **DEFERRED** (`OCP-PLUGIN-BACKLOG.md`, ADR-0002).
- Agent entry: **`../AGENTS.md`** (repo root).

## Document Map

| Type | Path | Purpose |
|------|------|---------|
| STATUS | `STATUS.md` | **Live** test count, active WU, next priorities |
| DOCUMENT | `MASTER_SYSTEM_PROMPT.md` | Product mission and non-negotiable goals |
| DOCUMENT | `OCP-PLUGIN-BACKLOG.md` | OCP plugin DEFERRED |
| DOCUMENT | `adr/ADR-0002-defer-ocp-plugin.md` | Defer OCP decision |
| DOCUMENT | `Architecture-Constitution.md` | System layers and boundaries |
| DOCUMENT | `Engineering-Principles.md` | Decision-making principles |
| DOCUMENT | `Feature-Registry.md` | Feature ownership and acceptance |
| DOCUMENT | `Legacy-Feature-Coverage.md` | LF-001..LF-090 parity registry |
| DOCUMENT | `Implementation-Roadmap.md` | Phase-by-phase plan |
| DOCUMENT | `UX-UI-Design-Blueprint.md` | UX/UI state design |
| DOCUMENT | `UI-Architecture.md` | Renderer layers, hooks, shells |
| DOCUMENT | `UI-Design-System.md` | Tokens, CSS Modules, Storybook |
| DOCUMENT | `UI-Component-Catalog.md` | Auto-generated (`npm run ui:catalog`) |
| DOCUMENT | `../../guides/Cursor-Agents-Guide.md` | **RU:** команды, агенты, циклы работы |
| GUIDES | `../../guides/README.md` | **Все** пользовательские и операционные руководства |
| DOCUMENT | `TASK-QUEUE.md` | Очередь задач для scope-intake |
| HANDOFFS | `handoffs/` | Active WU docs (P11+) |
| ARCHIVE | `handoffs/archive/P0N/` | Completed phase handoffs (P02–P08) |
| DOCUMENT | `Agent-Prompts.md` | Prompt index → handoffs and skills |
| RAT | `real-integration/` | Real adapter track (PROGRESS, steps, smoke) |

## Cursor Rules (`.cursor/rules/`)

| Rule | Apply | Purpose |
|------|-------|---------|
| `00-core.mdc` | always | Architecture, agent protocol, OCP/transfer backlog |
| `typescript-react-electron.mdc` | always | TS/React/Electron/IPC safety |
| `work-history.mdc` | always | Post-task audit log |
| `feature-registry.mdc` | globs | Feature-first implementation |
| `legacy-feature-coverage.mdc` | globs | LF-001..090 parity |
| `implementation-roadmap.mdc` | globs | Phase order and gates |
| `testing-observability.mdc` | globs | Tests, logs, correlation IDs |
| `ux-ui-electron-react.mdc` | globs | UX before UI; CSS Modules |
| `icons.mdc` | globs | Lucide via `AppIcon` |
| `ui-implementation-agent.mdc` | `/ui` | UI implementation |
| `domain-implementation-agent.mdc` | `/logic` | Domain / Use Cases |
| `holistic-reviewer.mdc` | `/audit` | Super reviewer |
| `arch-review-agent.mdc` | `/arch-review` | Architecture review |
| `reviewer-agent.mdc` | on trigger | Roadmap reviewer |
| `real-integration-agent.mdc` | on trigger | RAT reviewer |

## Cursor Skills (`.cursor/skills/`)

| Skill | Purpose |
|-------|---------|
| `scope-intake` | Ask user or default from STATUS/TASK-QUEUE |
| `ui-implementation-agent` | `/ui` renderer implementation |
| `domain-implementation-agent` | `/logic` Domain / Application |
| `holistic-reviewer` | `/audit` full merge audit |
| `softphone-architecture-review` | Before architectural changes |
| `feature-slice-design` | Vertical feature slice |
| `telephony-flow-review` | Call lifecycle review |
| `integration-contract-review` | OCP/window/IPC contracts |
| `legacy-feature-migration` | Legacy parity migration |
| `implementation-phase-planning` | Phase work breakdown |
| `ux-ui-flow-design` | UX states before React |
| `softphone-reviewer` | Gate keeper («Проверяй») |
| `real-integration-agent` | RAT gate keeper |
| `icons` | Icon catalog workflow |

## Commands (`.cursor/commands/`)

| Command | Action |
|---------|--------|
| `status.md` | Live STATUS |
| `scope.md` | Priorities without code |
| `plan-wu.md` | Break WU into steps |
| `ui.md` | UX/UI implementation |
| `logic.md` | Domain / Use Cases |
| `adapter.md` | RAT implementation |
| `preflight.md` | test + lint + catalog |
| `registry.md` | Feature Registry check (`npm run registry:check`) |
| `arch-review.md` | Architecture review (no code) |
| `review.md` | WU gate review |
| `rat-review.md` | RAT step review |
| `audit.md` | Holistic super review |

**Guides:** [`guides/README.md`](../../guides/README.md) · [`Cursor-Agents-Guide.md`](../../guides/Cursor-Agents-Guide.md) (Russian)
