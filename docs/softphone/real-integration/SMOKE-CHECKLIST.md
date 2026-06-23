# Manual Smoke Checklist (Real Adapters)

## Setup

- Copy `docs/softphone/real-integration/env.local.example` → `.env.local` at repo root
- `npm run dev`
- SIP-only: `http://localhost:5173/?adapters=real`
- OCP: `?mode=ocp&adapters=real&token=...&domain=...`

## R1 Registration

- [ ] Manual SIP form registers
- [ ] PhoneStatusBadge → Online
- [ ] Wrong password → RegistrationFailed visible
- [ ] Disconnect network → ConnectionOverlay SIP row
- [ ] Reconnect / manual retry works

## R2 Media

- [ ] Incoming ringtone audible
- [ ] Ringtone stops on answer
- [ ] Remote audio audible both directions

## R3 Calls

- [ ] Outgoing answered call
- [ ] Incoming answered call
- [ ] Reject incoming
- [ ] Hangup ends call, UI → idle
- [ ] DND rejects with 486

## R4 Controls

- [ ] Hold / resume
- [ ] Mute / unmute

## R5 OCP

- [ ] OCP auth success path
- [ ] Status Ready / Break
- [ ] Queue name on incoming (if queue configured)
- [ ] Campaign modal accept/reject

Record results in `PROGRESS.md` per step.
