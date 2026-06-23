---
name: integration-contract-review
description: SKILL - Use for OCP WebSocket, host-page API, window.Softphone, DOM events, Electron IPC, CRM integrations, and external contracts.
---

# SKILL: Integration Contract Review

Use this skill before changing external contracts.

External contracts include OCP WebSocket, host-page APIs, legacy `window.Softphone`, DOM events, Electron IPC, and CRM integrations.

## Inputs

- contract name
- caller
- receiver
- payload shape
- Feature Registry entry
- backward compatibility requirement
- security constraints

## Outputs

- typed contract
- validation boundary
- event mapping
- compatibility risk
- observability requirements
- tests required

## Procedure

1. Identify the external actor.
2. Identify the owning bounded context.
3. Identify whether the contract is optional.
4. Define the payload as `unknown` at the boundary.
5. Add validation and narrowing.
6. Map external payloads to internal commands or events.
7. Map internal events to external payloads.
8. Define error shape.
9. Define logging without secrets.
10. Define compatibility tests.

## Contract Ownership

Each external contract must have one owner.

Allowed owners:

- `OcpIntegrationAdapter`
- `HostSoftphoneApiAdapter`
- `ElectronIpcAdapter`
- `CrmIntegrationAdapter`

Never mutate a global API from multiple files.

## OCP Rules

OCP is optional.

Core SIP phone mode must run without:

- OCP WebSocket
- OCP auth token
- OCP statuses
- campaign events
- post-call processing

OCP messages must be typed and validated before entering Application.

## Host API Rules

Legacy `window.Softphone` may exist only as an adapter.

It must:

- expose a stable typed facade
- map calls to Use Cases
- emit typed integration events
- avoid multi-file mutation
- avoid direct SIP access

## DOM Event Rules

DOM events are external integration details.

They must:

- be isolated in Integration adapters
- use typed payloads internally
- be validated on input
- be documented in the contract

Domain must never depend on DOM events.

## Electron IPC Rules

IPC must:

- have typed channel names
- validate request payloads
- validate response payloads
- expose minimal preload APIs
- avoid exposing raw `ipcRenderer`
- avoid exposing Node globals to Renderer

## Security Checklist

Validate:

- auth tokens
- domains and URLs
- phone numbers
- status IDs
- call IDs
- file paths
- IPC payloads

Never log:

- tokens
- SIP passwords
- raw credentials
- sensitive customer data

## Test Checklist

Required tests:

- valid payload mapping
- invalid payload rejection
- backward compatibility mapping
- error shape mapping
- optional integration disabled mode
- no secret leakage in logs

## Completion Gate

Do not complete an integration change until:

- contract owner is clear
- payloads are typed
- input is validated
- OCP remains optional
- global mutation is centralized
- compatibility risks are documented
