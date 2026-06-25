---
name: scope-intake
description: >-
  Shared intake for implementation agents. Asks the user up to 3 clarifying
  questions; if no answer, picks priority from STATUS.md; registers F-XXX/LF-XXX
  against Feature Registry and handoffs. Use at the start of /ui and /logic sessions.
---

# SKILL: Scope Intake

Run at the **start** of every implementation session (`/ui`, `/logic`, `/adapter`).

## Inputs

- User message (may be empty)
- `docs/softphone/STATUS.md`
- `docs/softphone/TASK-QUEUE.md` (if present)
- `docs/softphone/Feature-Registry.md`
- Active handoff in `docs/softphone/handoffs/`

## Outputs

- Confirmed scope: phase, F-XXX, LF-XXX, bounded context, baseline tests
- `needs_input` or `in_progress` session status
- Registry gap list (if F-XXX missing)

## Procedure

1. Read `STATUS.md` → note test count and `Next work` priority list.
2. If user gave a clear task → map to F-XXX / LF-XXX / handoff; confirm in one line.
3. Else ask **up to 3 questions** (what to build, out of scope, mock vs real).
4. If user does not answer → take **priority #1** from STATUS (or first `pending` row in TASK-QUEUE).
5. Verify Feature Registry entry exists; if not → update registry **before** code.
6. State: baseline tests, files in scope, explicit out of scope, stop gate.
7. Emit response per [response-contract.md](../_shared/response-contract.md) with `needs_input` or `in_progress`.

## Registration checklist

| Artifact | When |
| --- | --- |
| `Feature-Registry.md` | New or changed behavior |
| `Legacy-Feature-Coverage.md` | LF-XXX touched |
| Handoff gate | WU deliverable complete |
| `STATUS.md` | WU closed or test count changed |
| `TASK-QUEUE.md` | Claim / complete queued task |
| `work-history/` | End of implementation session |

## Do not

- Start code before scope is confirmed or defaulted from STATUS
- Expand scope beyond one WU-sized unit
- Implement OCP or real transfer without explicit user resume
