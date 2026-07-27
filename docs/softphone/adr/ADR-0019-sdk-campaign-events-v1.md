# ADR-0019: SDK Campaign Events in Protocol v1

## Type

DOCUMENT.

## Status

Accepted (2026-07-26) — supersedes **O-CAMP-1** in ADR-0017 for campaign event
inclusion; privacy masks still follow ADR-0017 O-PII-1.

## Context

- **Features:** F-011 (SDK), F-028 (OCP campaign UI)
- **Legacy:** LF-038, LF-039 (notify parity); LF-040 accept/reject remains desktop UI
- **Contexts:** Integration, Operator
- **Layers:** `@softomnitel/omnicall-protocol`, Application mappers (DI-05), Local WS fan-out

ADR-0017 deferred `operator:campaign-offered` / `operator:campaign-cleared` past v1
because the privacy DTO was incomplete. Desktop F-028 now projects campaign offers
internally; CRM hosts need the same signal over the public SDK without OCP wire
leakage. Queue titles already ship as additive `queueLabel` on `call:*`.

## Decision

### O-CAMP-1 (revised) — Campaign events enter protocol v1

1. **Public event types** (additive, same protocol major):
   - `operator:campaign-offered`
   - `operator:campaign-cleared`

2. **Capability:** `operator.campaign.read`
   - Required (with `session.read.redacted`) to receive campaign events and to see
     the optional snapshot `operator.campaign` object.
   - Included in default pairing profiles `operator` and `call_controller` (not
     `presentation`).
   - Origin matrix governed (ADR-0018); missing persisted matrix keys migrate with
     default `true` (non-privileged additive default).

3. **Public offered payload** (redacted; never OCP wire):
   - `campaignId` — opaque id
   - `mode` — `"preview"` | `"progressive"` (maps desktop non-progressive / progressive)
   - optional `remoteNumber` — ADR-0017 phone mask only
   - optional desktop-safe labels (max 128): `companyLabel`, `strategyLabel`,
     `selectionLabel`, `queueLabel`
   - **Omitted:** `abonentId`, `companyId`, `queueId`, `selectionId`,
     `strategyCallId`, OCP `call_id` / `acallid`, raw phone, secrets

4. **Public cleared payload:**
   - `campaignId` — opaque id of the cleared offer
   - optional `reasonCode` — `accepted` | `rejected` | `call_ended` |
     `session_reset` | `superseded`
   - **`superseded` retained in the protocol enum for compatibility.** Desktop
     single-modal FSM **does not emit** Cleared with `superseded` when a second
     preview arrives while the modal is open — that offer is **held** in
     `pendingPreview` until accept/reject/clear (see below).

5. **Snapshot recovery:** optional additive `operator.campaign` object with the same
   redacted fields as offered (present only while an offer is active and the client
   has `operator.campaign.read`). Desktop maps `activeCampaign ?? progressiveContext`.
   Held `pendingPreview` is not exposed until promoted. Omitted otherwise.

6. **Desktop mapping:** Domain Events `OperatorCampaignOffered` /
   `OperatorCampaignCleared` → `ExternalSdkEventMapper` → Local WS. No Domain Event
   names, OCP entities, or raw payloads cross the public wire.

   **Single-modal hold (desktop behavior, 2026-07-26):** at most one preview modal.
   A second preview while offered is held until idle (accept/reject/clear) → clear
   visible → promote pending → emit **Cleared then Offered**. Progressive while
   preview is open updates badges only (no SDK Offered, modal stays open). Details:
   `docs/softphone/OCP-Call-Context.md` (Campaign FSM).

7. **Out of v1 scope (explicit non-goals):**
   - Public `operator:campaign-accept` / `operator:campaign-reject` commands
     (desktop Accept/Reject Use Cases + modal remain the control surface)
   - Unmasked phones / wire ids
   - Legacy DOM `campaignEvents` CustomEvent

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Keep deferred past v1 | Blocks CRM parity with desktop F-028 |
| Emit under `session.read.redacted` only | Weaker least-privilege vs foreshadowed `operator.campaign.read` |
| Expose full `OcpCampaignEventPayload` | Privacy / XSS blast radius; violates ADR-0017 O-PII-1 |
| Ship accept/reject commands now | Larger surface; desktop modal already owns control; defer |

## Consequences

- Protocol removes campaign types from `V1_DEFERRED_CAMPAIGN_EVENTS`.
- Fixtures: `operator:campaign-offered` becomes valid under schemas.
- Origin matrix + Settings i18n gain `operator.campaign.read`.
- Existing Origins without the new matrix key load via additive migration (no settings wipe).
- Clients without the capability see no campaign events/section (fail closed).
- Hosts must not assume a second preview immediately supersedes the first over SDK;
  expect hold-until-idle (Cleared→Offered on promote). `reasonCode: superseded` may
  still appear in older clients/docs but is not emitted by current desktop for that case.
- Docs: `PROTOCOL.md`, `OCP-Call-Context.md`, guide `events.md` / `capabilities.md`
  updated in the same change set.

## Architecture Checks

- Domain free of protocol DTOs; redaction in Application.
- OCP remains optional; SIP-only unaffected.
- Additive optional fields only; no removal of existing public fields.
- Fan-out validates wire messages before send.

## Related Links

- Supersedes: ADR-0017 O-CAMP-1 (deferral)
- Related: ADR-0012, ADR-0017 O-PII-1 / O-OCP-1, ADR-0018, F-011, F-028,
  `docs/softphone/OCP-Call-Context.md`
