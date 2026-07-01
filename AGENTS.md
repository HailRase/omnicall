# Enterprise Softphone — Agent Onboarding

- Purpose: single entry point for Cursor agents working on this repo.
- **Developer guide (RU):** `docs/softphone/Cursor-Agents-Guide.md`
- Live snapshot: `docs/softphone/STATUS.md`
- Task queue: `docs/softphone/TASK-QUEUE.md`

## Commands (`.cursor/commands/`)

| Command | Role |
| --- | --- |
| `/status` | Live STATUS snapshot |
| `/scope` | Priorities without code |
| `/plan-wu` | Break next WU into steps |
| `/ui` | UX/UI implementation |
| `/logic` | Domain / Use Cases |
| `/adapter` | RAT real adapters |
| `/preflight` | test + lint + catalog check |
| `/registry` | Feature Registry path check |
| `/arch-review` | Architecture review (no code) |
| `/review` | WU gate reviewer |
| `/rat-review` | RAT gate reviewer |
| `/audit` | Holistic super reviewer |

## Implementation agents

| Command | Skill |
| --- | --- |
| `/ui` | `.cursor/skills/ui-implementation-agent/SKILL.md` |
| `/logic` | `.cursor/skills/domain-implementation-agent/SKILL.md` |
| `/adapter` | `docs/softphone/real-integration/MASTER-AGENT-PROMPT.md` |

All implementation agents run **scope-intake** first.

Response format: `.cursor/skills/_shared/response-contract.md`

## Reviewer agents

| Command | Skill |
| --- | --- |
| `/review` | `softphone-reviewer` |
| `/rat-review` | `real-integration-agent` |
| `/audit` | `holistic-reviewer` |
| `/arch-review` | `softphone-architecture-review` |

Reviewers do not write production code or work-history.

## Read first (implementation)

1. `docs/softphone/STATUS.md`
2. `docs/softphone/MASTER_SYSTEM_PROMPT.md`
3. `docs/softphone/Architecture-Constitution.md`
4. `docs/softphone/Feature-Registry.md`
5. Current handoff in `docs/softphone/handoffs/`

## Rules (`.cursor/rules/`)

| Rule | Scope |
| --- | --- |
| `00-core.mdc` | always |
| `typescript-react-electron.mdc` | always |
| `work-history.mdc` | always |
| `version-release.mdc` | always — SemVer + manifest sync on release |
| `ui-implementation-agent.mdc` | `/ui`, renderer |
| `domain-implementation-agent.mdc` | `/logic`, domain/application |
| `holistic-reviewer.mdc` | `/audit` |
| `arch-review-agent.mdc` | `/arch-review` |
| `feature-registry.mdc` | src, registry |
| `legacy-feature-coverage.mdc` | domain, application, adapters |
| `implementation-roadmap.mdc` | docs, src |
| `testing-observability.mdc` | src, tests |
| `ux-ui-electron-react.mdc` | renderer |
| `icons.mdc` | renderer icons |
| `reviewer-agent.mdc` | `/review` |
| `real-integration-agent.mdc` | `/rat-review` |

## Skills index

`scope-intake`, `ui-implementation-agent`, `domain-implementation-agent`, `holistic-reviewer`, `feature-slice-design`, `implementation-phase-planning`, `softphone-architecture-review`, `telephony-flow-review`, `integration-contract-review`, `legacy-feature-migration`, `ux-ui-flow-design`, `softphone-reviewer`, `real-integration-agent`, `icons`

## User Cursor settings

Remove duplicates of workspace rules from User Rules — see `Cursor-Agents-Guide.md`.
