# Enterprise Softphone Agent Prompts

## Type

INDEX — reusable templates live in handoffs and skills.

## Live status

Read `docs/softphone/STATUS.md` before any implementation session.

## Prompt rules

- Name roadmap phase and LF-XXX IDs.
- Skip Operator/legacy operator platform unless user resumes `ADR-0005`.
- Architecture boundaries via `.cursor/rules/00-core.mdc`.
- Tests required; UI requires UX state design first.
- Adapters require ports and mock tests first.

## Where to find prompts

| Need | Path |
|------|------|
| Active WU prompts | `handoffs/P11-*-Agent-Prompt.md` |
| Archived WU prompts | `handoffs/archive/P0N/` |
| RAT implementation | `real-integration/MASTER-AGENT-PROMPT.md` |
| Phase planning | `.cursor/skills/implementation-phase-planning/SKILL.md` |
| Feature slice | `.cursor/skills/feature-slice-design/SKILL.md` |
| UX before UI | `.cursor/skills/ux-ui-flow-design/SKILL.md` |
| Reviewer output | `.cursor/skills/softphone-reviewer/templates.md` |
| RAT reviewer output | `.cursor/skills/real-integration-agent/templates.md` |

## Generic phase-start checklist

1. Read STATUS + Feature Registry + current handoff.
2. Domain Events → state → Use Cases → ports → mock adapters → projections → UI.
3. Update Feature Registry, Legacy Coverage, tests before finishing.
4. Create `work-history/YYYY-MM-DD/topic_HH-mm.md`.
