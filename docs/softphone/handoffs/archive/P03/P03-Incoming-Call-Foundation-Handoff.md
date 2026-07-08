# P03 Incoming Call Foundation Handoff

- Scope: `F-002` incoming call foundation for `LF-012`, `LF-013`, `LF-014`, `LF-015`, `LF-016`, `LF-017`, `LF-036`, `LF-061`, `LF-090`.
- Delivered: incoming call domain events, `CallStateMachine` incoming transitions, `AnswerCallUseCase`, `RejectCallUseCase`, `AutoAnswerPolicy`, `DndRejectPolicy`, display-name parser, host break-reason mapping, incoming projection, and presentational incoming modal.
- Ports/Adapters: `TelephonyGateway` now supports incoming handlers and answer/reject commands; `MediaGateway` supports incoming ringtone; `HostIntegrationGateway` added with mock and adapter mapping.
- Call Engine: incoming flow now supports receive, DND 486 auto-reject, auto-answer timer, manual answer/reject, reject reason emission, and cleanup on end.
- Tests/Checks: `npm run test`, `npm run lint`, and `npm run typecheck` pass with new unit, integration, and renderer tests for incoming scenarios.

## P04 Next Steps

- Build active call control panel (`hold`, `resume`, `mute`, `unmute`, `hangup`) on top of current `CallEngine` and projection structure.
- Reuse incoming/outgoing projection split and keep controls disabled by projection reason, not component-local rules.
- Keep host integration and legacy operator platform optional boundaries untouched while extending active state behavior.
