# ADR-AF-007 — Local user notification journal

**Status:** Accepted  
**Date:** 2026-07-17  
**Context:** Settings / Application / Adapters

## Decision

Every user-facing notification passes through `UserNotificationCaptureService`.
The service always records a sanitized journal entry and independently decides whether
the popup is presented from `notificationPopupEnabled`.

The app-scoped journal is stored for the current OS user, pruned with a rolling 24-hour
retention policy, and written atomically. Entries contain time, stable account identity,
display label, title snapshot/key/params, module, function, level, correlation id and
`suppressedAtEmission`.

## Security and privacy

Password, API key, token and credential-like fields are redacted before persistence.
The journal never stores arbitrary notification payloads. Corrupt documents are
quarantined by the file adapter rather than partially trusted.

## UX contract

Settings contains a dedicated history section with identity/module filters, title
search and pagination. Disabling popups never disables journal capture.

## Rejected alternatives

- Toast component owns history: bypasses non-renderer sources and popup-disabled events.
- Per-account files: prevents a single filtered all-user view.
- Unlimited retention: unnecessary privacy and disk-growth risk.
