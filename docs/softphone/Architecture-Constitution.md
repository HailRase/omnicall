# Enterprise Softphone Platform Architecture Constitution

## Type

DOCUMENT.

This document defines how the platform must be structured.

## Architectural Law

The platform is divided into six layers:

```txt
UI
↓
Application
↓
Domain
↓
Ports
↓
Adapters
↓
Infrastructure
```

Dependencies must always point inward.

No implementation may violate this constitution.

Any exception requires an Architecture Decision Record.

## UI Layer

Purpose:

User interaction and presentation.

Allowed:

- React components
- feature components
- form handling
- UI state mapping
- user input forwarding

Forbidden:

- SIP logic
- business rules
- Electron APIs
- WebSocket protocol logic
- repository access
- storage access
- direct adapter access

UI must only call Use Cases or UI-facing application facades.

Renderer implementation guide: `docs/softphone/UI-Architecture.md`, `docs/softphone/UI-Design-System.md`.

## Application Layer

Purpose:

Application orchestration.

Contains:

- Use Cases
- command handlers
- query handlers
- application services

Examples:

- `MakeCallUseCase`
- `AnswerCallUseCase`
- `TransferCallUseCase`
- `Changelegacy agent statusUseCase`
- `RegisterAccountUseCase`

Application coordinates business actions.

Application does not own business rules.

## Domain Layer

Purpose:

Business knowledge.

Contains:

- entities
- value objects
- domain services
- domain events
- business rules
- state machines

Examples:

- `Call`
- `Conference`
- `SipAccount`
- `Contact`
- `Agent`

Forbidden dependencies:

- React
- Electron
- JsSIP
- Zustand
- browser APIs
- Node APIs
- databases
- storage

Domain must be framework-independent and executable in plain TypeScript tests.

## Ports Layer

Purpose:

Contracts required by Domain and Application.

Examples:

- `TelephonyGateway`
- `SettingsRepository`
- `ContactRepository`
- `CallHistoryRepository`
- `NotificationGateway`
- `legacy operator gateway`
- `HeadsetGateway`

Ports define what the platform needs.

Adapters define how needs are fulfilled.

## Adapters Layer

Purpose:

Implement ports using external systems.

Examples:

- `JsSipTelephonyAdapter`
- `ElectronNotificationAdapter`
- `WebHidHeadsetAdapter`
- `LocalSettingsRepository`

Adapters may depend on external libraries.

Adapters must not leak library-specific objects into Domain.

## Infrastructure Layer

Purpose:

External technologies and platform details.

Examples:

- Electron main process
- Electron preload
- filesystem
- OS notifications
- tray
- auto updater
- logging backend
- SQLite or local storage

Infrastructure must never leak into Domain.

## Bounded Contexts

### Telephony

Responsible for:

- SIP registration
- calls
- hold and resume
- mute and unmute
- transfer
- conference
- recovery
- reconnect
- DTMF

Owns:

- `Call`
- `CallState`
- `CallEvent`
- `Conference`
- `SipAccount`

### Operator

Responsible for:

- agent authentication
- agent status
- agent presence
- post-call state
- logout reasons

Owns:

- `Agent`
- `legacy agent status`
- `AgentSession`

### Media

Responsible for:

- audio devices
- ringing
- local streams
- remote streams
- audio routing

Owns:

- `AudioDevice`
- `AudioSession`

### Headset

Responsible for:

- device discovery
- device state
- hardware call controls
- vendor adapters

Owns:

- `HeadsetDevice`
- `HeadsetState`

### Settings

Responsible for:

- preferences
- accounts
- device settings
- user configuration

Owns:

- `Settings`
- `DeviceSettings`
- `AccountSettings`

### Integration

Responsible for:

- legacy operator platform
- CRM contracts
- host-page contracts
- Electron IPC contracts
- future integrations

Owns:

- `Integration`
- `IntegrationSession`
- `ExternalSoftphoneApi`

## Communication Rules

Bounded contexts must not directly mutate each other.

Allowed:

- Domain Events
- Application Services
- Ports
- typed commands and queries

Forbidden:

- direct entity mutation across contexts
- shared mutable state
- cross-context repository access
- hidden global mutation

## Call Engine

The Call Engine is the heart of the platform.

All telephony operations must pass through it:

- register
- unregister
- make call
- answer
- reject
- hang up
- hold
- resume
- mute
- unmute
- transfer
- conference
- DTMF
- recovery
- reconnect

No UI, store, adapter, or integration may bypass Call Engine.

## Event Architecture

The platform is event-driven.

Business changes produce Domain Events.

Examples:

- `IncomingCallReceived`
- `OutgoingCallStarted`
- `CallAnswered`
- `CallHeld`
- `CallResumed`
- `CallTransferred`
- `CallEnded`
- `CallFailed`
- `RegistrationSucceeded`
- `RegistrationFailed`
- `AgentLoggedIn`
- `AgentLoggedOut`
- `legacy agent statusChanged`

Events are immutable facts.

State is derived from events.

## Telephony State Machine

Calls must use explicit finite states:

- `Idle`
- `Ringing`
- `Connecting`
- `Active`
- `Held`
- `Transferring`
- `Conference`
- `Ending`
- `Ended`
- `Failed`

Transitions must be explicit.

Invalid transitions must be impossible.

Boolean flags such as `isHeld`, `isEnded`, or `isTransferring` must not be primary state.

## State Management

Stores are projections.

Stores may:

- receive events
- update read models
- expose selectors

Stores must never:

- execute SIP actions
- execute Electron actions
- execute filesystem actions
- call repositories directly
- contain business rules

## Optional legacy operator platform Architecture

legacy operator platform is optional.

**Product status (2026-06-24):** legacy operator integration is **DEFERRED** to far backlog per ADR-0005 and `ADR-0005`. Core delivery does not require legacy operator platform implementation or smoke.

The platform must fully work as a SIP phone without legacy operator integration.

Allowed direction:

```txt
legacy operator platform Plugin
    ↓
Core Platform Ports
```

Forbidden direction:

```txt
Core Platform
    ↓
legacy operator platform
```

Core telephony must never depend on legacy operator platform.

## Headset Architecture

Headsets are adapters.

Examples:

- `JabraAdapter`
- `PolyAdapter`
- `EposAdapter`
- `WebHidAdapter`

Call Engine must not know vendor details.

Hardware events must be translated into application commands.

## Architectural Fitness Functions

The following must always be true:

- No circular dependencies.
- Domain has zero framework dependencies.
- UI never accesses adapters.
- UI never accesses repositories.
- UI never accesses SIP.
- Application owns orchestration.
- Domain owns business rules.
- Infrastructure owns technology concerns.
- legacy operator platform can be removed.
- JsSIP can be replaced (real track uses `@hailrase/jssip` fork — see `docs/softphone/real-integration/JSSIP-FORK.md`).
- Headset vendors can be replaced.

Any violation is an architectural defect.
