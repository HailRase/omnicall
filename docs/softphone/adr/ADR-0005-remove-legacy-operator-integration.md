# ADR-0005: Remove Legacy Operator Platform Integration

## Status

Accepted (2026-07-08)

## Context

The product ships as a standalone SIP softphone. Legacy operator-platform integration (authentication, agent statuses, queue sync, campaigns, WebSocket recovery) was was deferred and remained as dormant code behind optional bootstrap mode. Maintaining unused ports, adapters, projections, and documentation increased agent confusion and CI surface without user value.

## Decision

1. **Remove** legacy operator-platform integration from product and repository: domain `operator/` context, ports, use cases, services, projections, mock/real adapters, renderer UI, i18n keys, tests, and backlog docs.
2. **Supersedes** prior defer-operator-plugin ADR.
3. **SIP-only** is the only bootstrap path; `AppBootstrapConfig` has no alternate mode.
4. **Preserve** `PhoneStatus` (`online` / `offline` / `dnd`), SIP DND reject, SIP registration, calls, media, hold/mute/transfer, SIP recovery, settings, contacts/history, shell UX.
5. **Deprecate** legacy parity IDs tied solely to removed integration (see `Legacy-Feature-Coverage.md`); SIP-only IDs remain active.
6. Agents, rules, and docs must not reference removed integration.

## Consequences

- Positive: smaller codebase, single bootstrap path, no deferred-plugin guardrails in agents.
- Positive: tests and projections focus on telephony and settings.
- Negative: future operator-platform parity requires a new ADR and greenfield design.
- Unchanged: SIP registration, multi-call, transfer, and recovery behavior for end users.

## Alternatives considered

- Keep dormant code — rejected; explicit product decision to remove.
- Feature-flag removal — rejected; no runtime need for removed mode.

## References

- Supersedes: prior defer-operator-plugin ADR (removed).
- `docs/softphone/Feature-Registry.md`
- `docs/softphone/Legacy-Feature-Coverage.md`
