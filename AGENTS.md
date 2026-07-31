# Enterprise Softphone — Agent Onboarding

- Purpose: single entry point for Cursor agents working on this repo.
- **Guides (all onboarding docs):** [`guides/README.md`](guides/README.md)
- **Developer guide (RU):** [`guides/Cursor-Agents-Guide.md`](guides/Cursor-Agents-Guide.md)
- **Release / CI (RU):** [`guides/Developer-Release-CI-Guide.md`](guides/Developer-Release-CI-Guide.md)
- **User guide (RU):** [`guides/User-Guide-RU.md`](guides/User-Guide-RU.md)
- **Public distribution:** [`HailRase/omnicall-releases`](https://github.com/HailRase/omnicall-releases) (installers + manifest — **not** source code)
- **Migration checklist:** [`guides/Distribution-Migration-Checklist.md`](guides/Distribution-Migration-Checklist.md)
- Live snapshot: `docs/softphone/STATUS.md`
- Task queue: `docs/softphone/TASK-QUEUE.md`
- Bootstrap splash (single-stage `#boot-splash`): `docs/softphone/Bootstrap-Splash-Contract.md`
- UI Kit plan: `docs/ui-kit/UI-KIT.md`
- UI Kit visual canon: `docs/ui-kit/VISUAL-SPEC.md`
- **SIP transport/register refactor (T-008):** `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md`
- **OmniCall Kit project:** `omnicall-kit/README.md` (incubation copy)
- **OmniCall Kit GitHub (private):** https://github.com/HailRase/omnicall-kit — publishable protocol + kit
- **Desktop SDK integration (F-011/P12):** `omnicall-kit-integration/README.md`
- **OCP queue + campaign UI (F-028):** `docs/softphone/OCP-Call-Context.md`

## Commands (`.cursor/commands/`)

| Command | Role |
| --- | --- |
| `/status` | Live STATUS snapshot |
| `/scope` | Priorities without code |
| `/plan-wu` | Break next WU into steps |
| `/ui` | UX/UI implementation |
| `/ui-kit` | Reusable UI Kit primitives |
| `/logic` | Domain / Use Cases |
| `/adapter` | RAT real adapters |
| `/preflight` | test + lint + catalog check |
| `/release` | Release cut (SemVer, CHANGELOG, tag, CI) |
| `/registry` | Feature Registry path check |
| `/arch-review` | Architecture review (no code) |
| `/review` | WU gate reviewer |
| `/rat-review` | RAT gate reviewer |
| `/audit` | Holistic super reviewer |
| `/sdk-project` | Execute one standalone SDK work unit |
| `/sdk-integration` | Execute one desktop SDK integration work unit |
| `/sdk-review` | Review one SDK or desktop integration work unit |

## Implementation agents

| Command | Skill |
| --- | --- |
| `/ui` | `.cursor/skills/ui-implementation-agent/SKILL.md` |
| `/ui-kit` | `.cursor/skills/ui-kit-component-agent/SKILL.md` |
| `/logic` | `.cursor/skills/domain-implementation-agent/SKILL.md` |
| `/adapter` | `docs/softphone/real-integration/MASTER-AGENT-PROMPT.md` |
| `/release` | `.cursor/skills/release-agent/SKILL.md` |
| `/sdk-project` | `omnicall-kit/.cursor/skills/omnicall-kit-implementation/SKILL.md` |
| `/sdk-integration` | `.cursor/skills/omnicall-kit-integration/SKILL.md` |

Product implementation agents run **scope-intake** first. `/ui-kit` follows `docs/ui-kit/UI-KIT.md`; `/release` runs **release cut** only (not scope-intake).

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

**Headset (F-012):** before any bugfix or vendor work read `docs/softphone/HEADSET-AGENT-ONBOARDING.md` → `HEADSET-SYNC-CONTRACT.md` → `HEADSET-VENDOR-ONBOARDING.md` (if new device).

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
| `ui-kit.mdc` | renderer UI primitives |
| `icons.mdc` | renderer icons |
| `reviewer-agent.mdc` | `/review` |
| `real-integration-agent.mdc` | `/rat-review` |
| `release-agent.mdc` | `/release` |

## Skills index

`scope-intake`, `ui-implementation-agent`, `ui-kit-component-agent`, `domain-implementation-agent`, `holistic-reviewer`, `feature-slice-design`, `implementation-phase-planning`, `softphone-architecture-review`, `telephony-flow-review`, `integration-contract-review`, `legacy-feature-migration`, `ux-ui-flow-design`, `softphone-reviewer`, `real-integration-agent`, `release-agent`, `omnicall-kit-integration`, `icons`

## User Cursor settings

Remove duplicates of workspace rules from User Rules — see [`guides/Cursor-Agents-Guide.md`](guides/Cursor-Agents-Guide.md).
