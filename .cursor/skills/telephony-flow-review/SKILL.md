---
name: telephony-flow-review
description: SKILL - Use for call lifecycle, SIP registration, media, transfer, DTMF, reconnect, recovery, and headset-related telephony changes.
---

# SKILL: Telephony Flow Review

Use this skill for any change affecting calls, SIP registration, media, transfer, DTMF, reconnect, recovery, or headset call controls.

## Inputs

- Feature ID
- call flow being changed
- Domain Events
- state machine transitions
- Use Cases
- telephony port
- adapter behavior

## Outputs

- call lifecycle impact
- valid transitions
- invalid transitions
- failure behavior
- observability requirements
- tests required

## Procedure

1. Identify the call flow.
2. Identify the current state before the operation.
3. Identify the command being executed.
4. Identify the Domain Event that represents the result.
5. Identify the next state.
6. Identify invalid source states.
7. Identify adapter calls required.
8. Identify failure events.
9. Identify recovery behavior.
10. Identify logs and correlation IDs.

## Canonical States

Use:

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

Do not use boolean flags as primary state.

## Required Event Examples

Registration:

- `RegistrationRequested`
- `RegistrationSucceeded`
- `RegistrationFailed`

Calls:

- `IncomingCallReceived`
- `OutgoingCallStarted`
- `CallAnswered`
- `CallRejected`
- `CallEnded`
- `CallFailed`
- `CallHeld`
- `CallResumed`
- `CallMuted`
- `CallUnmuted`
- `CallTransferRequested`
- `CallTransferred`
- `CallTransferFailed`
- `DtmfSent`
- `DtmfFailed`

Recovery:

- `TelephonyDisconnected`
- `ReconnectScheduled`
- `ReconnectSucceeded`
- `ReconnectFailed`

## Failure Checklist

For every flow define behavior for:

- SIP registration failure
- transport disconnect
- invalid state transition
- adapter timeout
- media permission denied
- call already ended
- legacy operator platform unavailable
- headset disconnected

## Test Checklist

Required tests:

- valid transition test
- invalid transition test
- adapter success mapping
- adapter failure mapping
- state projection update
- log/correlation ID assertion for critical flows

## Completion Gate

Do not complete a telephony change until:

- Call Engine owns the operation.
- UI does not access SIP.
- Store does not execute SIP.
- State transition is explicit.
- Failure is observable.
- Tests cover success and failure paths.
