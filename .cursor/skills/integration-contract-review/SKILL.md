---
name: integration-contract-review
description: SKILL - Use for OCP WebSocket, ExternalClientGateway, Electron IPC, CRM integrations, and external contracts (legacy window.Softphone is not ported).
---

# SKILL: Integration Contract Review

Use this skill before changing external contracts.

External contracts include OCP WebSocket, future ExternalClientGateway / ExternalCommandRouter, Electron IPC, and CRM integrations. Legacy embed `window.Softphone` is documented as historical only and must not be reintroduced.

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
- `ExternalClientGateway` / `ExternalCommandRouter` (future)
- `ElectronIpcAdapter`
- `CrmIntegrationAdapter`

Never introduce product APIs via browser globals (`window.Softphone` and similar).

## legacy operator platform Rules

legacy operator platform is optional.

Core SIP phone mode must run without:

- legacy operator WebSocket
- legacy operator auth token
- legacy operator platform statuses
- campaign events
- post-call processing

legacy operator platform messages must be typed and validated before entering Application.

## Host API Rules

Legacy embed `window.Softphone` is **not ported** to Axatalk.

External browser tabs must use:

- `ExternalClientGateway` (local WS into Electron main) — future
- `ExternalCommandRouter` → Facade / Use Cases with `callType: 'external' | 'sdk'`

Until the gateway exists, OCP external entry points live on `AccountBootstrapFacade` (`authenticateOcpFromHost`, `changeOcpStatusFromHost`) with validated payloads from `OcpHostApiContract`.

Forbidden:

- mutating `window.Softphone` (or any host global API)
- multi-file patching of browser globals for product APIs
- direct SIP access from external command adapters

## DOM Event Rules

DOM events as a host-page embed bus are legacy-only (jssip-phone).

Axatalk product code must not rely on CustomEvents for CRM ↔ softphone command transport.

If a DOM event appears at a browser boundary temporarily, it must:

- be isolated in Integration adapters
- use typed payloads internally
- be validated on input
- be documented as transitional

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
- legacy operator platform remains optional
- global mutation is forbidden for host APIs
- compatibility risks are documented
