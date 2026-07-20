# Office continue prompt — paste into Cursor Agent

Copy everything below the line into a new agent chat on the office PC after `git pull`.

---

```markdown
# OFFICE CONTINUE — F-011 / P12 / DI-10 status briefing + next steps
# Repo: softphone-electron · branch: `feature/axatalk-sdk`
# Language: respond to the human in **Russian**. Docs edits in English.

## Your job (read-only first)

You are an **orientation + next-step coach**, not an auto-implementer.
1. Read the sources of truth below.
2. Tell me exactly where the track is.
3. Give a numbered plan of what I (human) and/or agents should do next.
4. Ask me clarifying questions for decisions that require a human.
5. Do **not** start coding, committing, publishing npm, or flipping F-011 to `implemented`
   unless I explicitly ask after answering your questions.

## Sources of truth (read in order)

1. `docs/softphone/STATUS.md` — live snapshot
2. `axatalk-sdk-integration/WORK-UNITS.md` — DI-10 status (`review` / awaiting `/sdk-review`)
3. `axatalk-sdk-integration/evidence/DI-10-compatibility-e2e-p12-close.md` — canonical DI-10 evidence
4. `axatalk-sdk-integration/SMOKE-CHECKLIST.md` — Record + OPEN cells
5. `docs/softphone/Feature-Registry.md` — F-011 (must still be `in progress`)
6. `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md`
7. `docs/softphone/Legacy-Feature-Coverage.md` — LF-051 / 065 / 080 / 081 (not closed)
8. `axatalk-sdk/evidence/SDK-10-release-candidate.md` — Mode A done; Mode B / `latest` blocked
9. `axatalk-sdk/docs/guide/compatibility-matrix.md`
10. `package.json` version (expect `0.11.2`)

## Current stage (verify; do not invent)

As of home push 2026-07-21:

| Item | Expected state |
| --- | --- |
| Branch | `feature/axatalk-sdk` (pull latest) |
| Desktop version | `0.11.2` |
| SDK API | `@axatalk/sdk` **47** / `@axatalk/protocol` **169** |
| DI-00…DI-09 | `done` |
| SDK-00…SDK-10 Mode A | `done` (RC-ready / stable-blocked; **no** npm `latest`) |
| DI-10 | `review` — packaged handshake/hostile/incompat evidence real; FAIL findings remediated |
| F-011 | `in progress` — **not** `implemented` |
| P12 | open |
| SemVer bump | not done (correct until F-011 close) |

Packaged subset already proven (do not re-claim as full E2E):

- win-unpacked / NSIS / MSI `Axatalk-0.11.2`
- Node packaged smoke 5/5 + Edge browser smoke 2/2
- Reports under `axatalk-sdk-integration/evidence/DI-10-*-smoke-report.json`

Still **OPEN** (forbids F-011/`implemented` and P12 close without real evidence or named waiver):

- Settings pair / deny / revoke UX (live)
- Packaged pair+PoP → snapshot/events
- SIP-only / OCP / call command matrix (live)
- Prior published SDK ↔ desktop cells (N/A until first public SDK publish)

## What you must output to me

### A. Status briefing (short)

- Confirm DI-10 / F-011 / P12 / SemVer / API from the files above
- Call out any drift vs this prompt after `git pull`

### B. Numbered next-step plan

Propose this default order (adjust only if files contradict):

1. **On office PC:** `git pull` on `feature/axatalk-sdk`; `npm ci` (desktop root + `axatalk-sdk/` if needed); confirm clean `git status`.
2. **Re-run gate:** paste `/sdk-review` for **DI-10 only** (independent reviewer — no production fixes in that session).
3. **If `/sdk-review` PASS:** DI-10 → `done`, but F-011/P12 stay open until remaining smoke.
4. **If FAIL:** only a DI-10 refactor prompt — no new unit.
5. **After DI-10 `done`:** human chooses path for remaining OPEN cells:
   - **Path A — complete real smoke** (Settings pair/revoke + SIP/OCP call) and record in SMOKE-CHECKLIST, then close F-011/P12 with evidence; justified SemVer MINOR if product-visible close.
   - **Path B — human-named waivers** for specific OPEN cells (name + date + reason in evidence) — only I can authorize waivers; agents must not invent them.
   - **Path C — defer** product close; keep F-011 `in progress`; do not publish `@axatalk/*` `latest`.
6. **Only after F-011 close criteria:** consider SDK-10 Mode B / npm publish decisions (separate explicit session).

### C. Questions for me (mandatory — ask before acting)

Ask me at least these (adapt if already answered in chat):

1. После `/sdk-review` DI-10: идём в **полный live smoke** (Path A), **waivers** (Path B), или **откладываем close** (Path C)?
2. Есть ли в офисе **controlled SIP / OCP** тестовая инфраструктура сегодня?
3. Нужен ли повторный **packaged smoke** на этом ПК (пересборка `npm run build:win`), или достаточно уже закоммиченных reports с дома?
4. Планируем ли в ближайшие дни **npm publish** `@axatalk/*` (хотя бы `rc`), или это явно later?
5. Есть ли **человеческое имя** для waiver-подписи, если выберем Path B?

### D. Hard stops to remind me

- Do not mark F-011 `implemented` from handshake-only evidence
- Do not enable `window.hide` for green cells
- Do not publish npm `latest` while P12/F-011 open
- Do not start a fictional DI-11
- Transfer R6 backlog stays untouched

## First action

Read the files, print the briefing + plan + questions. Wait for my answers before any `/sdk-integration` or production edits.
```
