# Agent Continuation Protocol

- Purpose: resume F-034 safely from prompts such as “continue”, “next WU”, or “приступи”.
- Inputs: `PROGRESS.md`, `10-WORK-UNITS.md`, current git state, and canonical repository docs.
- Outputs: exactly one completed, deferred, or blocked WU with evidence and synchronized documentation.

## Required sequence

1. Confirm branch `feature/notification-center`; preserve unrelated working-tree changes.
2. Read `PROGRESS.md` and select the first non-`done` / non-`deferred` WU unless the user names a WU.
3. Re-read that WU’s Goal, Why, How, Boundaries, Evidence, Done when, and Continue hint.
4. Set only that WU to `in_progress`; implement no later-WU behavior.
5. Re-read `00-PRODUCT-SPEC.md` Compatibility law before any behavior change.
6. Update tests and only the canonical docs required by `09-DOCUMENTATION-SYNC.md`.
7. Run focused verification first; run broader gates only when the WU requires them.
8. Set the WU to `done` with evidence, `deferred` (WU-08/09 only) with reason, or `blocked` with one concrete reason.
9. Create or update one Russian `work-history/YYYY-MM-DD/notification-center-*_HH-mm.md` entry.
10. Reply in Russian using `.cursor/skills/_shared/response-contract.md`.
11. Stop at explicit `/preflight` or `/review` gates and suggest the exact next command.

## Guardrails

- Never regress default toast presentation, journal always-on, or ADR-0013 critical raises.
- Never put presentation policy solely in React components or Zustand.
- Never import Electron, Node, React, Zustand, adapters, or storage into Domain.
- Never raise the shell for informational/remote toasts.
- Never replace incoming/campaign/SDK modals with toast policy.
- Never mutate F-011, F-028 wire, SIP Call Engine, headset HID, or External Services HTTP behavior for this feature.
- Never commit, tag, push, or bump SemVer unless the user explicitly authorizes the applicable action.
- If blocked by a product decision, ask no more than three precise questions.

## Suggested first user prompt after plan review

```txt
Приступи к WU-00 из notification-center/10-WORK-UNITS.md
```
