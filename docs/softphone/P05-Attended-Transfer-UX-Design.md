# P05 Attended Transfer UX Design (WU3)

- Phase: `P05` WU3; Feature: `F-007` (attended transfer core); Legacy: `LF-029`, `LF-032`.
- Primary context: `Telephony`; projections: `multiLineCallProjection`, extended `transferProjection` (no React UI in WU3).
- Out of scope WU3: transfer mode panel, target entry field, cancel button (`LF-030` UI → WU4); `TransferModeStarted` / `TransferModeCancelled` / `CallAutoUnheldAfterTransferFailure`.

## Event Design Choice

- Consultation SIP leg reuses existing outgoing events (`OutgoingCallRequested`, `OutgoingCallStarted`, `CallAnswered`) — no duplicate SIP stack.
- Relationship metadata uses dedicated events: `ConsultationCallRequested`, `ConsultationCallStarted` — projections bind source + consultation legs without parsing SIP.
- Attended completion uses `AttendedTransferRequested`, `AttendedTransferCompleted`, `AttendedTransferFailed` — separate from blind `CallTransfer*` events.

## Call Relationship

| Role | Meaning | Typical state during attended flow |
| --- | --- | --- |
| `source` | Original call to transfer | `Held` during consultation |
| `consultation` | Outgoing leg to transfer target | `Connecting` → `Active` |

- `sourceCallId` — held line; `consultationCallId` — second line once consultation starts.
- `TransferSession.phase` drives projection UX keys below.

## Projection UX States

| Phase key | Meaning | Driven by |
| --- | --- | --- |
| `consultation_dialing` | Consultation outgoing in progress | `ConsultationCallRequested` |
| `consultation_active` | Consultation answered, ready to complete | `ConsultationCallStarted` |
| `attended_transfer_in_progress` | Gateway attended REFER (mock) | `AttendedTransferRequested` |
| `attended_transfer_failed` | Completion failed, legs restored | `AttendedTransferFailed` |
| `idle` | No attended transfer session | initial / after `AttendedTransferCompleted` + cleanup |

## Multi-Line Read Model (WU3 data only)

```txt
multiLineCallProjection.lines: [{ callId, role, state }]
primaryCallId       — active unheld line (consultation when active)
consultationCallId  — consultation leg when present
sourceCallId        — source leg during attended session
```

WU4 wires `multi-line-call-list` test ID; WU3 only projects data.

## Disabled Reasons (projection-driven)

| Reason key | When |
| --- | --- |
| `consultation_in_progress` | Second consultation or conflicting transfer while session active |
| `transfer_not_allowed` | Source/consultation state invalid for complete |
| `second_session_disabled` | `multiSessionsEnabled` false (`LF-032`) |

## Error and Recovery

- Consultation outgoing failure: consultation leg `Failed`/`Ended`; source remains `Held`/`Active`; session cleared.
- `AttendedTransferFailed`: source restored to pre-transfer state (`Held` if was held); consultation stays `Active`.
- WU4 surfaces failure banner; WU3 projects `attended_transfer_failed` + `lastFailureReason`.

## Active Call Controls (consultation leg)

- `activeCallControlsProjection` follows last primary line events; WU4 may switch focus per line.
- Hold/resume/mute on source disabled while `attended_transfer_in_progress` (`transfer_in_progress`).
- Hangup enabled on both legs during consultation (emergency exit until WU4 cancel).

- Post-consultation-failure read model: `multiLineCallProjection` keeps single source line with `sourceCallId` + `primaryCallId` aligned; `attendedPhase: idle`; consultation line removed.
- Attended gateway failure: event projection `attended_transfer_failed`; session phase `attended_transfer_failed` (domain) allows retry `attendedTransfer` complete.

## Reserved Test IDs (WU4 — not implemented WU3)

- `multi-line-call-list` — container for 2+ call lines.
- `call-line-{callId}` — individual line row.
- `control-attended-transfer` — complete attended transfer action.
- `control-start-consultation` — start consultation (internal API WU3; button WU4).
- Reuse WU2: `transfer-panel`, `control-cancel-transfer`, `transfer-failure-banner`.
