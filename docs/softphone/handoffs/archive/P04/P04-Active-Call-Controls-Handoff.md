# P04 Active Call Controls Handoff

- Scope: `F-004`, `F-005`; legacy `LF-022`, `LF-024`, `LF-027`.
- Delivered: active call control domain events (`CallHeld`, `CallResumed`, `CallMuted`, `CallUnmuted`, `CallHangupRequested`, `CallEnded`, `ActiveCallControlFailed`), Use Cases (`HoldCallUseCase`, `ResumeCallUseCase`, `MuteCallUseCase`, `UnmuteCallUseCase`, `HangupCallUseCase`), `ActiveCallControlService` with telephony/media operation handlers, `CallEngine` integration, `activeCallControlsProjection` (disabled reasons + `lastOperationError`), presentational `ActiveCallControlsPanel` with error banner and retry, `useSoftphoneCallActions` with projection-driven guards.
- Ports/Mocks: `TelephonyGateway` hold/resume/hangup + `MockTelephonyGateway` failure scenarios (`holdScenario`, `resumeScenario`, `hangupScenario`); `MediaGateway` mute/unmute + `MockMediaGateway` failure scenario.
- Hangup semantics: `CallHangupRequested` is published only after successful telephony gateway hangup; failed hangup emits `ActiveCallControlFailed` and keeps call/projection out of `Ending`.
- Bootstrap: `createAccountBootstrap` wires mock adapters in `src/infrastructure/bootstrap/createAccountBootstrap.ts`.
- UX artifact: `docs/softphone/P04-Active-Call-Controls-UX-Design.md`.
- Tests/Checks: `npm run test`, `npm run lint`, `npm run typecheck` pass with FSM, CallEngine failure paths, use case failure path, projection invalid-payload guard, and renderer panel (including keyboard Enter/Space on enabled control).

## Migration Evidence

### LF-022 — Hold and unhold session

- Implementation: `src/application/services/telephonyCallControlOperations.ts` (`executeHoldCall`, `executeResumeCall`), `src/application/services/ActiveCallControlService.ts`, `src/domain/telephony/CallStateMachine.ts`
- Use Cases: `HoldCallUseCase`, `ResumeCallUseCase`
- Domain Events: `CallHeld`, `CallResumed`, `ActiveCallControlFailed`
- Projection: `src/application/projections/activeCallControlsProjection.ts`
- UI: `src/renderer/components/call/ActiveCallControlsPanel.tsx`, `src/renderer/hooks/useSoftphoneCallActions.ts`
- Tests: `src/domain/telephony/CallStateMachine.test.ts`, `src/application/services/CallEngine.test.ts`, `src/application/use-cases/ActiveCallControlsUseCases.test.ts`, `src/application/projections/activeCallControlsProjection.test.ts`
- UX states: active → held → active; hold disabled when not active; resume disabled when not held; `hold failed` / `resume failed` with retry

### LF-024 — Mute and unmute microphone

- Implementation: `src/application/services/mediaCallControlOperations.ts` (`executeMuteCall`, `executeUnmuteCall`)
- Use Cases: `MuteCallUseCase`, `UnmuteCallUseCase`
- Domain Events: `CallMuted`, `CallUnmuted`, `ActiveCallControlFailed`
- Projection: `activeCallControlsProjection` (`muted`, mute/unmute disabled reasons, `lastOperationError`)
- UI: `ActiveCallControlsPanel` mute indicator + mute/unmute buttons
- Tests: `CallEngine.test.ts` (mute/unmute success and failure), `ActiveCallControlsUseCases.test.ts`, `activeCallControlsProjection.test.ts`
- UX states: muted/unmuted badge; `already muted` / `not muted` disabled reasons; `mute failed` / `unmute failed` with retry

### LF-027 — Hang up call

- Implementation: `telephonyCallControlOperations.ts` (`executeHangupCall`)
- Use Case: `HangupCallUseCase`
- Domain Events: `CallHangupRequested` (post-gateway success), `CallEnded`, `ActiveCallControlFailed`
- Projection: ending/ended states; hangup disabled when call ending or terminal
- UI: hangup button + retry on `hangup failed`
- Tests: `CallEngine.test.ts` (hangup success, hangup gateway failure without `CallHangupRequested`), `ActiveCallControlsUseCases.test.ts`
- UX states: active/held → ending → ended; `call ending` disables other controls; failed hangup keeps active state

## Deferred

- Real JsSIP telephony/media adapters for hold, resume, hangup, mute, unmute (mock-only in P04).
- E2E harness scenarios for active call controls (deferred until dedicated Electron E2E harness exists).
- Headset LED sync for mute (consumes events in P10; events exist in P04).

## P05 Next Steps

- Define multi-call policy and transfer relationship model (`LF-021`, `LF-023`, `LF-028`–`LF-032`).
- Add transfer domain events (`CallTransferRequested`, `CallTransferred`, `CallTransferFailed`, etc.) and Use Cases (`StartTransferUseCase`, `BlindTransferUseCase`, `AttendedTransferUseCase`).
- Extend projections for second session, exclusive hold, and transfer mode UX without moving SIP logic into React or stores.
- Keep OCP optional; telephony commands continue through `CallEngine` only.
