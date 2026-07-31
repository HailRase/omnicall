# F-031 External Services Product Specification

- Purpose: locked v1 behavior for profile-scoped outbound HTTP automations.
- Inputs: user configuration, manual Run now, and selected focused-call/OCP Domain events.
- Outputs: fire-and-forget HTTP attempts, Run now result, and a redacted 100-entry journal.

## Positioning and ownership

- Product path: Settings → Integrations → External Services.
- External Services is a child of Integrations beside OCP; OmniCall Kit remains a separate top-level leaf.
- Audience: authenticated users with an active OmniCall account profile.
- Configuration is scoped by the active `SettingsAccountKey` in `UserSettings`.
- This is outbound webhook automation only, not F-011, F-028 control, or inbound HTTP.
- Primary bounded context is Integration; Settings owns profile persistence.

## Information architecture

- Root shows collections and the Journal at the bottom.
- A collection has a stable UUID, display name, enabled toggle, variables, and flat requests.
- Collection rows show the enabled-request count and provide fast enable, rename, delete, duplicate, import, and export actions.
- Duplicate collection preserves definitions with new UUIDs and appends `(copy)` to the display name.
- Request rows show enabled state and provide fast toggles without opening detail.
- Request detail supports rename, edit, delete, and Run now.
- Nested folders and hard item-count limits do not exist in v1.

## HTTP definition

- Allowed methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- URL, query values, header values, and body support `{{name}}` placeholders.
- Query parameters and headers are ordered key/value tables.
- Body modes: `none`, `json`, `x-www-form-urlencoded`, `raw`.
- Tokens are ordinary header/query values; there is no separate Auth model or secrets vault.
- Timeout is fixed at 10 seconds; retries and offline replay do not exist.
- `http` and `https` are allowed, including localhost, LAN, and private IP destinations.

## Dispatch behavior

- A collection and its request must both be enabled for automatic dispatch.
- Every matching focused-line event is enqueued; maximum HTTP concurrency is three.
- Trigger handling is asynchronous and never blocks Domain event publication, Call Engine, OCP, SDK, or telephony Use Cases.
- Deleting a collection prevents new starts for its IDs; already in-flight attempts finish.
- On profile switch/logout, pending old-profile work is cancelled; in-flight work may finish.
- Responses are observational only and can never issue commands or mutate calls.

## Trigger switches

Each request independently enables any number of:

- `incoming_ringing`
- `outgoing_connecting`
- `call_answered`
- `call_ended`
- `call_rejected`
- `call_missed`
- `campaign_offered`
- `campaign_accepted`
- `campaign_rejected`
- `acd_context_appeared`
- `post_call_processing`

Manual execution uses `manual_run`. Hold, mute, SIP registration, OCP login/logout, other OCP status transitions, SDK pairing, and dedicated transfer triggers are excluded. `post_call_processing` is the sole operator-status edge (OCP `POST_CALL_PROCESSING` transition only).

## Focus policy

- Every call-related trigger, including ringing, fires only when its call is focused at event evaluation time.
- Non-focused ringing, answered, ended, rejected, or missed events do not fire.
- Rapid calls on different lines may each fire when each event is independently focus-eligible.
- Re-invite, hold, and resume cannot be interpreted as new ringing or connecting.

## Variables

Base catalog:

- `call_id`
- `caller_id`
- `called_id`
- `timestamp` as ISO-8601 UTC
- `call_direction` as `inbound` or `outbound`
- `event_type` using the stable codes above
- `user_login`
- `hangup_reason`

Campaign/ACD fields are additive only when already present in typed Domain/Application projections. Collection variables include user-defined entries such as `base_url` (shared constants for the collection; edited via collection Variables dialog / preview). Every occurrence of `{{name}}` is replaced; an absent variable becomes the literal `undefined`. Duplicate collection keys and empty-key-with-value rows are rejected on save; colliding system names are soft-warned and overridden at run time. The request editor Variables tab must list the Domain system catalog so operators can discover names such as `call_id` / `user_login` without developer docs.

## Run now and result UX

- Run now executes the saved or explicitly validated draft through the same application dispatch path.
- It always shows status when available, duration, and a response body truncated to 16 KiB.
- Success means network completion plus HTTP 2xx.
- Network, timeout, DNS, abort, and non-2xx results are errors.
- 4xx/5xx bodies remain visible; no business JSON success parsing occurs.
- Invalid JSON after substitution is still sent as raw content and produces a Run UI warning.

## Journal

- Journal retains the latest 100 completed attempts in FIFO order.
- Each record includes time, profile, collection/request identity, event code, outcome, status when available, duration, redacted headers, truncated response body, and structured error.
- Header values named `Authorization`, `Cookie`, or `X-Api-Key`, case-insensitively, persist and display as `***`.
- Full PII masking is not a v1 requirement.

## Persistence and portability

- External Services configuration persists with the account profile.
- F-030 operator preferences export/import includes the configuration.
- Single-collection import/export uses a lightweight versioned OmniCall JSON format, not Postman v2.1.
- SIP passwords, OCP API keys, SDK pairing material, and machine-local device bindings remain excluded.

## Locked edge behavior

- Rename changes display text only; UUIDs remain stable.
- App sleep receives no special recovery; timeout/abort may produce a journal error.
- Ended without caller ID still dispatches with `caller_id` resolved to `undefined`.
- Missed and rejected remain separate switches.
- OCP login trigger does not exist.
- No insecure-HTTP warning or SSRF blocklist is added in v1.

## Explicit non-goals

- Inbound HTTP API, Postman scripts, conditions, chaining, or cloud sync.
- Prebuilt Bitrix connector, HMAC signing, secrets vault, retries, or offline catch-up.
- Response-driven call control, nested folders, hold/mute triggers, or transfer-specific triggers.
- Any change to SIP registration, Call Engine, headset, OCP protocol, or SDK command behavior.
