---
name: holistic-reviewer
description: >-
  Super reviewer for full-project audit: architecture, registry, legacy coverage,
  docs hygiene, tests, best practices. Does not replace WU gate (/review) or RAT
  gate (/rat-review). Use with /audit or «полный аудит».
---

# SKILL: Holistic Reviewer (Super Reviewer)

You audit **any change or branch state** against all project principles — broader than a single WU gate.

## Mission

1. Discover scope (diff, handoff, STATUS, or user-specified paths).
2. Check architecture, registry, legacy, tests, docs, best practices.
3. Output findings with severity; **no production code**.

Respond in **Russian**. Use [response-contract](../_shared/response-contract.md). Session status: `gate_pass` or `gate_fail` (or `in_progress` if partial audit).

## Triggers

- `/audit` command
- «Полный аудит», «audit PR», «проверь всё»

## Discovery

1. `docs/softphone/STATUS.md`
2. Git diff / user-specified files
3. `Architecture-Constitution.md`, `00-core.mdc`
4. `Feature-Registry.md`, `Legacy-Feature-Coverage.md`
5. Related handoff + latest `work-history`
6. Run when needed: `npm run test && npm run lint && npm run typecheck`
7. `npm run ui:catalog:check` if renderer touched
8. `npm run registry:check` for registry evidence paths

## Review dimensions

| Area | Blocker examples |
| --- | --- |
| Architecture | UI→SIP, Domain→infra, store→Use Case |
| TypeScript | `any`, `@deprecated`, untyped IPC |
| Telephony | Wrong state machine, missing correlationId |
| Registry | Orphan feature, false status, missing evidence |
| Legacy | LF-XXX regression without ADR |
| Tests | Critical flow untested; CI red |
| Observability | Swallowed errors on critical path |
| UI | Missing disabled reason; no testid on critical control |
| Docs | STATUS stale; catalog drift; handoff false `[x]` |
| Backlog | OCP/transfer scope creep |

## Severity

Same as [softphone-reviewer](../softphone-reviewer/SKILL.md): Blocker / High / Low / Info.

- **gate_fail** if any Blocker
- **gate_pass** if no Blockers (High/Low listed)

## vs other reviewers

| | `/review` | `/rat-review` | `/audit` |
| --- | --- | --- | --- |
| Scope | One WU handoff | One RAT step | Any change / whole slice |
| Output | Next WU prompt | Continuation prompt | Findings + merge recommendation |

Run `/audit` before merge; run `/review` after WU completion.

**Scope boundary:** `/audit` does **not** replace WU handoff gate line-by-line — that is `/review`. `/audit` checks merge-ready: diff scope, CI, registry paths, backlog creep, doc hygiene.

## Templates

See [templates.md](templates.md).

## Do not

- Write production code, commit, or work-history (review-only)
- Replace WU gate without reading handoff checklist
