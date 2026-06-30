# Multi-Call — Deferred Backlog

## Status

Items below are **out of active WU6 / RAT step 08** scope unless user resumes this file.

## Tone priority FSM (A2) — **done** (F-018)

Implemented: `resolveActiveTonePlayback` (Domain), `TonePlaybackCoordinator` (Application), `ArbiterMediaGateway` (Adapter decorator). Wired in mock and real bootstrap.

Priority (high → low): incoming ringtone > ringback > busy/failed > none.

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
