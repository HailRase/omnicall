# Step 05: Hold & Mute Real (R4)

## Goal

LF-022, LF-024, LF-027 on real SIP.

## Feature IDs

F-004, F-005

## Tasks

1. `JsSipTelephonyAdapter`: `holdCall`, `resumeCall` (re-INVITE hold)
2. `BrowserMediaAdapter`: mute/unmute local track
3. Verify `ActiveCallControlsPanel` error banner on gateway failure

## UX

- Hold/resume/mute/hangup disabled reasons from projection
- Failed operation → retry banner (existing UX)

## Smoke

See `SMOKE-CHECKLIST.md` § R4.

## Gate

- Hold/resume works per SBC behavior
- Mute stops local TX; icon updates

## Update PROGRESS

Mark step 05 `done`.
