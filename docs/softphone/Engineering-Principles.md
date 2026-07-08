# Enterprise Softphone Engineering Principles

## Type

DOCUMENT.

This document defines engineering decision-making rules.

## Principle 1: Protect The Domain

The Domain layer is the most valuable part of the system.

Replaceable:

- React
- Electron
- JsSIP
- Zustand
- storage engines
- legacy operator platform
- headset SDKs

Not replaceable:

- business rules
- call lifecycle
- telephony state model
- domain events

Optimize for domain stability.

## Principle 2: Business Logic Must Have One Home

Business rules must exist in exactly one place.

Forbidden outside Domain:

```ts
if (call.state === "Active") {
  // business decision
}
```

Business rules belong to:

- entities
- domain services
- state machines
- value objects

## Principle 3: Framework Independence

Business code must survive framework replacement.

Domain must not care about:

- React
- Electron
- JsSIP
- Zustand
- browser APIs
- Node APIs

Domain code must be testable without Electron and React.

## Principle 4: Explicit Over Implicit

Hidden behavior creates bugs.

Prefer:

- `answerCall()`
- `holdCall()`
- `CallHeld`
- `RegistrationFailed`

Avoid:

- `toggleCallState()`
- `handleCall()`
- `CallStateChanged`
- `processEvent()`

Intent must be obvious.

## Principle 5: Events Represent Facts

Events describe things that happened.

Good:

- `CallAnswered`
- `CallHeld`
- `CallEnded`

Bad:

- `HandleCall`
- `UpdateCall`
- `ProcessCall`

Facts are immutable.

## Principle 6: State Is Derived

State should follow events.

Bad:

```ts
call.state = "Held";
```

Preferred:

```txt
CallHeld
↓
Reducer
↓
Held read model
```

## Principle 7: One Direction Of Dependencies

Dependencies must always move inward.

Forbidden:

```txt
Domain -> Infrastructure
```

Allowed:

```txt
Infrastructure -> Ports -> Domain
```

## Principle 8: Replaceability Is A Feature

Ask before accepting any dependency:

> If this library is replaced tomorrow, how much code changes?

If the answer is "half the application", the boundary is wrong.

## Principle 9: Composition Over Inheritance

Prefer:

```txt
CallEngine
 + TelephonyGateway
 + EventBus
 + StateMachine
```

Avoid deep inheritance hierarchies.

Inheritance couples behavior.

Composition isolates behavior.

## Principle 10: Small Units Of Responsibility

Every unit should have one reason to change.

Bad:

- one service that registers SIP
- answers calls
- updates UI
- stores history
- plays sounds
- emits host-page events

Good:

- `CallEngine`
- `MediaService`
- `CallHistoryService`
- `NotificationService`
- `HostIntegrationAdapter`

## Principle 11: Tell, Do Not Ask

Avoid asking objects for state and mutating them outside.

Prefer command methods that preserve invariants:

```ts
call.hold();
```

The object should protect itself.

## Principle 12: Invalid States Must Be Impossible

Avoid mutually inconsistent flags:

- `isHeld`
- `isEnded`
- `isMuted`
- `isTransferring`

Use explicit state models and state machines.

## Principle 13: Critical Flows Must Be Observable

Critical flows:

- registration
- incoming call
- outgoing call
- transfer
- recovery
- reconnect
- legacy operator platform status change

Each must have logs, events, and correlation IDs.

## Principle 14: Design For Failure

Assume:

- SIP disconnects
- legacy operator WebSocket disconnects
- Internet drops
- Electron renderer crashes
- headset disconnects
- storage writes fail

Recovery is part of the design.

## Principle 15: No Hidden Side Effects

Functions must be predictable.

Bad:

- `saveSettings()` also reconnects SIP
- `setStatus()` also updates UI
- `hangup()` also mutates external API state

Each unit should have one primary effect.

## Principle 16: Use Cases Are The Entry Point

Business operations enter through Use Cases.

Examples:

- `MakeCallUseCase`
- `AnswerCallUseCase`
- `TransferCallUseCase`
- `RegisterAccountUseCase`
- `Changelegacy agent statusUseCase`

Never bypass Use Cases from UI or stores.

## Principle 17: Feature-First Thinking

Every implementation must map to:

- Feature ID
- acceptance criteria
- bounded context
- test coverage

No orphan code.

No speculative code.

## Principle 18: YAGNI

Build extension points, not unused implementations.

Do not implement future CRM adapters, conference engines, or headset vendors before a real requirement exists.

## Principle 19: KISS

The simplest architecture that satisfies requirements wins.

Complexity requires justification.

Simplicity is the default.

## Principle 20: DRY Carefully

Never duplicate business rules.

Small duplication is acceptable when abstraction would hide intent.

Avoid premature abstraction more than small duplication.

## Principle 21: Performance Through Architecture

First ensure:

- correct boundaries
- correct state model
- stable subscriptions
- predictable effects

Then measure and optimize.

## Principle 22: Security By Default

Validate all external input:

- IPC payloads
- legacy operator WebSocket messages
- SIP-derived metadata
- host-page events
- configuration files

Trust nothing.

Validate everything.

## Principle 23: Testability Is Architecture

Every Use Case, Domain Service, and State Machine must be testable without real infrastructure.

If code is hard to test, the design is probably wrong.

## Principle 24: Maintainability Beats Short-Term Speed

Do not sacrifice boundaries for convenience.

The platform must survive long-term evolution.

## Principle 25: Telephony Comes First

This is a telephony platform.

Primary concern:

- call reliability

Secondary concerns:

- UI polish
- animations
- visual effects

Calls are more important than visuals.
