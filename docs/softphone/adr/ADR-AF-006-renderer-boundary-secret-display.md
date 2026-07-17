# ADR-AF-006 — Renderer boundary for saved secret display

**Status:** Accepted  
**Date:** 2026-07-17  
**Context:** Settings / Application / Renderer

## Decision

Saved SIP password and OCP API key may be loaded only through
`AccountBootstrapFacade.loadSavedAccountProfileSecrets(profileId)` after an explicit
profile selection. The returned values enter only the local Account form state,
remain masked by default, and are cleared or replaced when profile/mode state changes.

Secrets remain forbidden in Domain Events, projections, Zustand, logs, notification
journal entries, profile JSON and settings JSON. The boundary must not expose list or
bulk-read operations.

## Consequences

- A complete saved profile supports one-click sign-in and explicit reveal controls.
- Application projections continue to expose only secret-availability booleans.
- Stale async reads are discarded with a profile-selection generation guard.
- Removing a remembered password uses a dedicated Facade action.

## Rejected alternatives

- Placeholder-only fields: conflicts with the selected saved-profile UX.
- Secrets in profile projections or Zustand: increases lifetime and accidental leak surface.
- Persisting masked values in profile JSON: masking is presentation, not encryption.
