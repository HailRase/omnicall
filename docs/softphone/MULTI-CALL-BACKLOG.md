# Multi-Call — Deferred Backlog

## Status

Items below are **out of active WU6 / RAT step 08** scope unless user resumes this file.

## Tone priority FSM (A2)

**Problem:** Multiple lines can produce ringtone, ringback, busy, failed tones simultaneously.

**Target architecture:**

```txt
ToneArbiter (Application or Media adapter coordinator)
  ← requests from CallEngine / orchestrators
  → single active tone stream via MediaGateway
  Priority (high → low): incoming ringtone > ringback > busy/failed > none
```

**Deliverables (future WU):**

- Domain or application policy: `TonePriority`, `ToneRequest`
- Port extension or `MediaGateway` coordinator (no duplicate WebAudio loops)
- Events: `TonePlaybackSuperseded` (optional)
- Tests: two ringing + one ringback → only incoming audible
- UX: `P05-Tone-Priority-UX-Design.md`

**WU6 interim:** stop ringback/other tones when hold-all or exclusive resume runs; no full arbiter.

## Transfer as per-session mode (E)

**Vision:** Each session has optional `transferMode`. User presses Transfer on a line → that session held + transfer mode → consultation or blind from same input region.

**Deferred:** Current `TransferPanel` + global transfer projection remains. Do not refactor in WU6.

**Resume trigger:** «resume transfer mode refactor» or P05 transfer UX phase 2.

## Incoming during attended transfer (E2)

Accept incoming cancels transfer mode — implement with per-session transfer mode backlog.

## Diagnostics module (G2)

SBC hold failures and policy rejections → structured logs now; user-facing diagnostics UI in **P09**.

## Real transfer multi-call (RAT)

See `real-integration/TRANSFER-REAL-ADAPTER-BACKLOG.md` — separate from WU6 multi-call hold policy.
