# P11 Call UI Design Parity — Handoff

> Align main call interface with reference `softphone-electron-desigh` skeleton.  
> **Out of scope:** settings overlay, recovery overlay, header, operator status panel.

**Reference:** `C:\Users\User\Desktop\ELECTRON\softphone-electron-desigh`  
**Features:** F-003, F-004, F-016 | **Legacy:** LF-011, LF-020, LF-021, LF-022, LF-023

## Reference layout (call zone)

```txt
┌──────────────────────────────┐
│ Context (scroll, flex-1)       │
│  · idle empty state          │
│  · SessionCard (1 call)      │
│  · SessionStack (2+ calls)     │
│  · DTMF panel (mode)         │
│  · Transfer flow (mode)      │
├──────────────────────────────┤
│ CallControls (labeled row)   │
├──────────────────────────────┤
│ DialPad (input + keys + CTA) │
└──────────────────────────────┘
```

## Task queue

| # | Task | Deliverables | Status |
| --- | --- | --- | --- |
| 1 | Layout skeleton | `SoftphoneLayout` zone order; context flex-1 top; controls pinned bottom; remove dashed diagnostic border | done |
| 2 | Session area | `CallIdleEmptyState`, `CallSessionCard`, `CallSessionStack`; wire `CallContextShell`; remove horizontal `CallSessionTabs` from controls | done |
| 3 | Call controls | `CallControlsBar` with icon + caption labels (mute, hold/resume, transfer, DTMF, hangup); replace `ActiveCallQuickBar` | done |
| 4 | Dialpad | Full-width input + green call CTA; letter sublabels; collapse keys when active call + empty input | done |
| 5 | DTMF mode | `DtmfKeypadPanel` overlay in context; remove dialpad Number/DTMF toggle | done |
| 6 | Outgoing card | `OutgoingCallCard` — operator copy only (no UI state / call ID) | done |
| 7 | Transfer polish | `TransferPanel` visual parity with reference `TransferFlow` (step chrome) | done |
| 8 | Gate | Storybook both themes; `npm run test && lint && typecheck && ui:catalog` | done |

## Acceptance (per task)

- Presentational components only; disabled reasons from projections
- Russian copy; light + dark via tokens
- Existing test IDs preserved where possible; new IDs documented in catalog
- No Domain / Use Case changes unless projection field missing (escalate `/logic`)

## Gate checklist

- [x] Task 1–2 done
- [x] Task 3–6 done
- [x] Task 7 transfer polish done
- [x] Task 8 gate (Storybook light/dark, ui:catalog:check)
- [x] Tests green — **916 passed**, 1 skipped (verified 2026-07-01)
- [x] Feature Registry F-016 note updated
- [x] work-history entry
