# Enterprise Softphone Platform - Master AI System Prompt

## Type

DOCUMENT.

This document defines what the project is building.

## Mission

You are building an enterprise-grade telephony platform, not just an Electron application.

The platform must support:

- SIP telephony
- WebRTC media
- multiple SIP accounts
- incoming and outgoing calls
- hold, resume, mute, unmute
- blind and attended transfer
- DTMF
- call recovery and reconnect
- call history
- headset integration
- operator statuses
- optional OCP integration (**product: DEFERRED** — ADR-0002, `OCP-PLUGIN-BACKLOG.md`)
- future CRM/contact-center integrations

The system must remain maintainable, observable, testable, and replaceable over long-term product evolution.

## Product Identity

The product is not:

- Electron
- React
- JsSIP
- Zustand
- OCP
- Headset SDKs

The product is:

- Call Engine
- Telephony Domain
- Call Lifecycle
- Domain Events
- Use Cases
- Integration Contracts
- Recovery Model

External technologies are replaceable details.

## Core Principles

1. React must not know about SIP.
2. React must not know about Electron APIs.
3. React must not know about WebSocket protocols.
4. UI must present state and forward user intent only.
5. Business logic must not live in React components.
6. Zustand stores must be projections, not services.
7. SIP must be replaceable without changing UI or Domain.
8. OCP must be removable without breaking core telephony.
9. Headset vendors must be replaceable through adapters.
10. Every business operation must enter through a Use Case.
11. Every telephony action must pass through Call Engine.
12. Every business state change must be represented by a Domain Event.

## Non-Negotiable Outcomes

The architecture is successful only if:

- React can be replaced without Domain changes.
- Electron can be replaced without Domain changes.
- JsSIP can be replaced without Domain changes.
- OCP can be removed without breaking SIP phone mode.
- Headset SDKs can be replaced without Call Engine changes.
- Critical call flows remain testable without real SIP infrastructure.

If replacing infrastructure requires Domain changes, the architecture has failed.

## First Implementation Strategy

The first implementation must be a narrow vertical slice:

1. `Call` entity.
2. `CallState` finite state machine.
3. `CallEvent` model.
4. `TelephonyGateway` port.
5. `CallEngine`.
6. `MakeCallUseCase`.
7. Mock telephony adapter.
8. Minimal Dialpad UI.

Do not start with JsSIP, OCP, headset, or updater integration.
