# Step 08: Multi-Call Real (RAT)

> **Prerequisite:** P05 WU6 mock gate closed (`P05-WU6-Multi-Call-Completeness-Handoff.md`).  
> **Product law:** `docs/softphone/P05-Multi-Call-Product-Decisions.md`.

## Scope

Real JsSIP multi-session on dev SBC:

- Hold-all before second outgoing (LF-021) — re-INVITE hold
- Hold-all before incoming answer (WU6)
- Exclusive resume (LF-023)
- Connecting block (WU6)
- No orphan sessions after hangup one of N lines

## Out of scope

- Transfer backlog (`TRANSFER-REAL-ADAPTER-BACKLOG.md`)
- OCP (ADR-0002)
- Tone FSM (`MULTI-CALL-BACKLOG.md`)
- 3+ simultaneous holds if SBC fails → log + `MultiCallOperationRejected`, no drop (G2)

## Expected files

- `JsSipTelephonyAdapter` — multi-session hold/resume audit
- `docs/softphone/real-integration/SMOKE-CHECKLIST.md` § R7
- `PROGRESS.md` step 08 row

## Smoke R7 (manual, two extensions)

| ID | Scenario | Expected |
| --- | --- | --- |
| R7-1 | Active call → second outgoing | First held, second connects |
| R7-2 | Active call → answer incoming | First held, incoming active |
| R7-3 | Two held → resume line B | A stays held, B active |
| R7-4 | Hangup active, one held | Held stays held (D1) |
| R7-5 | multiSessions OFF + active → second incoming | 486 auto-reject |

## Gate

- Mock regression green
- R7-1–R7-3 **PASS** minimum on dev SBC
- PROGRESS updated

## Update PROGRESS

Mark step 08 `done` only when R7 gate passes or SBC limitation documented in ADR with fail-safe behavior.
