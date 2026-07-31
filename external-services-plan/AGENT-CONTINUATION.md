# Agent Continuation Protocol

- Purpose: resume F-031 safely from prompts such as “continue”, “next WU”, or “приступи”.
- Inputs: `PROGRESS.md`, `10-WORK-UNITS.md`, current git state, and canonical repository docs.
- Outputs: exactly one completed or blocked WU with evidence and synchronized documentation.

## Required sequence

1. Confirm branch `feature/external-services`; preserve unrelated working-tree changes.
2. Read `PROGRESS.md` and select the first non-`done` WU unless the user names a WU.
3. Re-read that WU’s Goal, Why, How, Boundaries, Evidence, Done when, and Continue hint.
4. Set only that WU to `in_progress`; implement no later-WU behavior.
5. Update tests and only the canonical docs required by `09-DOCUMENTATION-SYNC.md`.
6. Run focused verification first; run broader gates only when the WU requires them.
7. Set the WU to `done` with evidence, or `blocked` with one concrete reason.
8. Create or update one Russian `work-history/YYYY-MM-DD/external-services-*_HH-mm.md` entry.
9. Reply in Russian using `.cursor/skills/_shared/response-contract.md`.
10. Stop at explicit `/preflight` or `/review` gates and suggest the exact next command.

## Guardrails

- Never await outbound HTTP from Call Engine or telephony Use Cases.
- Never import Electron, Node, fetch, React, Zustand, adapters, or storage into Domain.
- Never expose raw IPC or execute HTTP from renderer components.
- Never mutate F-011, F-028, SIP, headset, SDK command, or transfer behavior.
- Never commit, tag, push, or bump SemVer unless the user explicitly authorizes the applicable action.
- If blocked by a product decision, ask no more than three precise questions.
