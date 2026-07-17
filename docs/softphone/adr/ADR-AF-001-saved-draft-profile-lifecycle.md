# ADR-AF-001: Saved Draft Profile Lifecycle

## Type

DOCUMENT.

## Status

Accepted (2026-07-16)

## Context

- **Features:** F-001, F-023, F-024, F-028
- **Legacy:** LF-006, LF-007, LF-077
- **Contexts:** Settings (primary), Integration
- **Layers:** Domain, Application, Ports, Adapters

Operators need to save profile metadata and optional secrets (SIP password, OCP API key) **before** a successful SIP registration so a failed attempt leaves a reusable draft. Today:

1. Remembered SIP password is typically persisted **after** successful registration.
2. `AuthorizeSipAccountUseCase` may promote `activeProfileKey` / apply per-profile settings too early relative to SIP-ready success.
3. Account can switch identities by unregistering the current session (`ensureUnregisteredBeforeAccountSwitch`), which conflicts with the avatar-only logout target (ADR-AF-003).

Secrets must never enter JSON profile/settings documents, Domain Events, projections, toasts, or logs.

## Decision

1. **Two lifecycle markers** for saved account profiles (non-secret fields only):
   - **Draft** — opted-in metadata (+ optional secrets in `SecretStoragePort`) persisted before or during an auth attempt; not promoted to active successful session.
   - **Successful** — marked only after SIP registration succeeds for that identity (`successfulUseAt` / equivalent non-secret marker justified by schema migration).

2. **Opt-in pre-auth save** is an Application operation that atomically coordinates:
   - validated secret-free profile metadata persistence;
   - `SecretStoragePort.saveSecret` for remembered SIP password when requested;
   - profile-scoped OCP API key save when requested;
   - classified compensation if a required opted-in write fails (surface error; do not silently drop).

3. **Promotion rules (amended by ADR-AF-005):**
   - On **Login** (account session activation), promote `activeProfileKey`, apply that profile’s settings side effects, and mark successful-use — **before** waiting for SIP registration.
   - SIP registration failure must **not** undo promotion or clear the active account session.
   - While an account session is active, another identity cannot replace it without avatar logout (ADR-AF-003).
   - Draft profiles do **not** auto-login at startup.

4. **Secret query surface:** view models expose booleans only (`hasSavedSipPassword`, `hasSavedOcpApiKey`, `hasCompleteOcpConfiguration`). Never return secret strings.

5. **Identity stability:** profile lookup remains stable across saved profile IDs and provisional OCP account keys. If OCP later yields a distinct SIP identity, Application migrates/links secrets under the successful SIP key rather than duplicating them.

6. **Migration / rollback:** extending `SavedAccountProfile` JSON is additive and secret-free. Existing profiles without a success marker are treated as successful if they already participated in post-register flows (backward compatible). Pre-register early `activeProfileKey` writes are retired in WU-01; rollback is restore prior Use Case behavior behind tests.

## Alternatives Considered

| Alternative | Benefits | Risks | Why rejected |
|---|---|---|---|
| Keep post-success-only secret save | Minimal code churn | Breaks requirement #5 (save before attempt); failed drafts unusable | Conflicts with product contract |
| Store passwords/API keys in profile JSON | Simple | Secret leakage, audit failure | Forbidden by architecture |
| Infer success from secret existence | No new fields | False positives; secrets ≠ authorization | Unsafe semantics |
| Auto-login drafts at startup | Faster reopen | Unexpected network/auth; violates SIP-only safety | Explicitly out of scope |

## Consequences

- **Positive:** failed auth leaves editable reusable drafts; active session/settings stay intact; secret boundary preserved.
- **Negative:** schema/metadata migration and Use Case split around authorize vs promote.
- **Testing:** Domain serialization/lifecycle; Application pre-auth save + failure non-promotion; adapter atomic/compensated writes.
- **Observability:** log opt-in save outcomes and promotion with correlation ID; never log secret values.
- **Rollback:** revert WU-01 persistence fields and restore post-success-only remember-password path.

## Architecture Checks

- Domain remains framework-independent.
- UI does not access adapters/repositories.
- Secrets only via `SecretStoragePort`.
- State transitions remain explicit (draft → successful only after SIP-ready).
- Critical flows remain observable.

## Related Links

- Feature Registry: F-001, F-023, F-024, F-028
- Plan: `auth-flow/auth-flow-refactoring.md` (WU-01)
- Design: `docs/softphone/P11-Local-Account-Profiles-Design.md`
- Related ADRs: ADR-AF-003 (Account sole sign-in), ADR-AF-004 (settings gate)
