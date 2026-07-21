# ADR-AF-004: Settings Authorization Gate

## Type

DOCUMENT.

## Status

Accepted (2026-07-16) — **amended 2026-07-21 by ADR-0018**: pre-auth exception for
Settings → Integrations → **Axatalk SDK** only (blacklist / Origin policy). OCP Module and
all other non-Account sections remain gated.

## Context

- **Features:** F-016, F-024, F-028
- **Legacy:** LF-076, LF-077, LF-082, LF-084, LF-086, LF-087
- **Contexts:** Settings
- **Layers:** Application projections, Renderer routing/UI

Today Settings defaults to Account when no account session is active, but sidebar sections and deep links (`#/settings/:sectionId`) must not freely open gated sections. Product requires **Account** plus the narrow **Integrations → Axatalk SDK** exception (ADR-0018) before account session activation; all other sections stay blocked.

Gate condition was originally **SIP ready / registered**. **ADR-AF-005** supersedes the condition: gate on **local account session activation** (Login), not SIP-ready. SIP registration remains a telephony concern surfaced in System State.

## Decision

1. **Gate condition (ADR-AF-005):** `hasActiveAccountSession` is true after Login / restored disk SIP account (`AccountSessionActivated`). Until then, Settings → **Account** and Settings → **Integrations → Axatalk SDK** (ADR-0018 exception) are available; all other sections remain gated. SIP-ready is **not** required to open other sections.

2. **Availability view model** (Application pure `derive*` helper):
   - Account: enabled;
   - **Integrations → Axatalk SDK:** enabled **before** account session (ADR-0018) so
     operators can manage Origin blacklist / allow / per-Origin capability policy without
     SIP sign-in;
   - every other section (including **Integrations → OCP Module** and other Integrations
     children): disabled with semantic reason key `settings.nav.disabled.authorizeFirst`
     (not localized text in the derive function) until account session is active.

3. **Route / overlay guard:** direct navigation to a blocked Settings section redirects to Account via the existing navigation API (`replace`, no history pollution). Call context and active-call overlay remain mounted; no data loss of Account draft inputs beyond normal React remount rules for the Account panel itself.

4. **UI wiring:** shell hook → `SettingsPanel` → `SettingsSidebar` consumes the availability VM. Disabled items use UI Kit disabled + tooltip; components do not invent business checks.

5. **After SIP-ready:** all permitted sections return. Existing overlay layout, deep links from header menu, and active-call overlay behavior remain unchanged.

6. **Pre-auth exceptions:** Account, plus **Integrations → Axatalk SDK** (ADR-0018).
   Diagnostics, General, Sessions, Codecs, Headset, Video, Integrations/OCP Module, and
   other Integrations children remain blocked until account session activation.

7. **Post-gate OCP Module:** edit-only per ADR-AF-003; no bypass via sidebar group child navigation or `onOpenIntegrationsSettings`.

## Alternatives Considered

| Alternative | Benefits | Risks | Why rejected |
|---|---|---|---|
| Soft default to Account without hard gate | Minimal code | Deep links still open other sections | Fails requirement #6 |
| Component-local `if (!registered) return null` checks | Fast | Inconsistent; easy to miss a path | Must be projection + route guard |
| Gate on OCP authenticated instead of SIP | Aligns with operator module | Blocks SIP-only operators; wrong success definition | Violates SIP-only invariant |
| Block entire Settings overlay pre-auth | Stronger lock | Removes Account sign-in surface | Account must remain available |

## Consequences

- **Positive:** no pre-auth settings mutation outside Account and the Axatalk SDK Origin
  policy surface; consistent deep-link behavior; SIP-only and OCP share one gate.
- **Negative:** operators cannot tweak theme/language before first account session
  (intentional); Axatalk SDK Origin lists are machine-scoped (shared-PC risk accepted in
  ADR-0018).
- **Testing:** availability unit tests; sidebar disabled reasons; blocked hashes redirect;
  Axatalk SDK reachable pre-auth; OCP Module still blocked pre-auth; registered user opens
  all sections; active call preserved on redirect; Integrations bypass paths covered.
- **i18n:** `settings.nav.disabled.authorizeFirst` in `ru`, `en`, `fr`, `de`, `bg`.
- **Rollback:** restore free pre-auth navigation or remove the Axatalk SDK exception only
  with ADR amendment.

## Architecture Checks

- UI does not access adapters.
- Business gate lives in Application projection, not ad hoc React.
- Domain remains framework-independent.
- Active call context must not unmount due to redirect.

## Related Links

- Feature Registry: F-016, F-024, F-028
- Plan: `auth-flow/auth-flow-refactoring.md` (WU-05)
- UI Architecture: `docs/softphone/UI-Architecture.md`
- Related ADRs: ADR-AF-003, ADR-AF-005, ADR-0004, ADR-0018
