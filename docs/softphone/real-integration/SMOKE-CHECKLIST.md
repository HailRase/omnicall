# Manual Smoke Checklist (Real Adapters)

> **R5 OCP:** **DEFERRED** (ADR-0002). Do not run or gate core work on R5. See `docs/softphone/OCP-PLUGIN-BACKLOG.md`.

## Setup

- Copy `docs/softphone/real-integration/env.local.example` → `.env.local` at repo root
- `npm run dev`
- SIP-only: `http://localhost:5173/?adapters=real`
- OCP: `?mode=ocp&adapters=real&token=...&domain=...`

## R1 Registration

- [x] Manual SIP form registers
- [x] Header SIP status → **Зарегистрирован** (dot green)
- [x] Wrong password → header **Не зарегистрирован** + auth message
- [x] Disconnect network → header **Нет соединения** (countdown if auto-reconnect on)
- [x] Reconnect / manual transport reconnect works (Settings → **Состояние системы**)
- [ ] Settings **Состояние системы**: transport + registration rows, journal, manual actions — **re-smoke T-008** (2026-07-02)

## R2 Media

- [x] Incoming ringtone audible
- [x] Ringtone stops on answer
- [x] Remote audio audible both directions

## R3 Calls

- [x] Outgoing answered call
- [x] Incoming answered call
- [x] Reject incoming
- [x] Hangup ends call, UI → idle
- [x] DND rejects with 486

## R4 Controls

- [x] Hold / resume
- [x] Mute / unmute

## R7 Multi-call (RAT step 08 — **closed** 2026-06-25)

> Manual dev SBC (onedemoserver.online, two extensions). Minimum gate R7-1…R7-3 PASS.

- [x] R7-1 Second outgoing with first held — **PASS**
- [x] R7-2 Answer incoming with active held — **PASS**
- [x] R7-3 Exclusive resume swap — **PASS**
- [x] R7-4 Hangup active, held remains (D1) — **PASS**
- [x] R7-5 multiSessions OFF → auto-486 — **PASS** 2026-06-25 (temp repo default; **re-smoke via P11 WU1 settings UI** — `UI-SMOKE-ENABLERS.md`)

## R6 Transfer (RAT step 07 / 07b — **BACKLOG**)

> Paused 2026-06-25. Not an active gate. Resume via `TRANSFER-REAL-ADAPTER-BACKLOG.md`.

- [x] Blind transfer on-net extension (A,D) — **PASS** 2026-06-24
- [ ] Blind transfer off-net PSTN (B,C) — **FAIL** 2026-06-24 (backlog)
- [ ] Attended transfer with consultation leg — **backlog** (not verified)
- [x] Transfer failure surfaces banner + retry — **PASS** (NOTIFY 487 mapped; projection recovery)

## R5 OCP (DEFERRED — ADR-0002)

> Out of active scope. Resume only via `OCP-PLUGIN-BACKLOG.md`.

- [ ] OCP auth success path — **deferred**
- [ ] Status Ready / Break — **deferred**
- [ ] Queue name on incoming (if queue configured) — **deferred**
- [ ] Campaign modal accept/reject — **deferred**

Record results in `PROGRESS.md` per step.

---

## Recorded results (2026-06-24, dev SBC)

**Environment:** Electron `npm run dev`, `VITE_ADAPTER_MODE=real`, `.env.local` (onedemoserver.online).

**Automated (canonical):** 640 passed, 1 skipped; lint/typecheck green.

| Gate | Status | Source in PROGRESS |
| --- | --- | --- |
| R1 Registration | **PASS** | Step 02 smoke notes; R1 carry-over session |
| R2 Media | **PASS** | Manual smoke session R2+R3+R4 — R2-1/2/3 |
| R3 Calls | **PASS** | Manual smoke session R2+R3+R4 — R3-1/2/3/4/5 |
| R4 Controls | **PASS** | Manual smoke session R2+R3+R4 — R4-1/2 |
| R6 Transfer | **backlog** | `TRANSFER-REAL-ADAPTER-BACKLOG.md` |
| R7 Multi-call | **PASS** (R7-1…R7-5) | Step 08 smoke notes 2026-06-25 |
| R5 OCP | **deferred** | ADR-0002 — see `OCP-PLUGIN-BACKLOG.md`; not a RAT gate |

**R1-5 note:** auto-reconnect on network restore PASS; manual retry button not exercised to exhaustion (auto-reconnect in progress).
