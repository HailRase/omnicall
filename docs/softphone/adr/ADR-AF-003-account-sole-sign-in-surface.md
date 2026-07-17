# ADR-AF-003: Account Is the Sole Sign-In Surface

## Type

DOCUMENT.

## Status

Accepted (2026-07-16)

## Context

- **Features:** F-001, F-016, F-024, F-028
- **Legacy:** LF-006, LF-007, LF-011, LF-077, LF-086
- **Contexts:** Settings (primary), Integration
- **Layers:** Application Facade, Renderer UI

Sign-in is currently split:

- Settings → Account: SIP form, linked-profile OCP vs SIP password methods, Account logout, generic Retry, switch-profile confirmation that unregisters before switching.
- Settings → Integrations → OCP Module: first-time setup, login picker, Connect/Disconnect, Retry.

This creates ambiguous ownership, duplicate recovery controls, and an identity-switch path that bypasses avatar logout. Product requires:

1. Account owns SIP-only and OCP module sign-in modes.
2. Avatar logout is the **only** user logout entry point (existing OCP logout-reason cascade preserved).
3. No Account logout, no Account generic Retry, no switch-account confirmation.
4. OCP Module becomes edit-only for the active authenticated profile after SIP-ready.

Removing the registered-profile switch flow is an **intentional** F-024 / LF-077 behavior change and must not be treated as undocumented cleanup.

## Decision

1. **Account is the sole sign-in surface.** Modes (local UI intent, not SIP account type):
   - **SIP only** — existing SIP fields and sign-in behavior.
   - **OCP module** — OCP login / Domain / Proxy API Key via UI Kit `InputGroup` (+ selection where needed); starts the only OCP-backed sign-in command.

2. **Facade contract:** one typed Account sign-in command (mode, profile identity, non-secret fields, secure values at call boundary, save preferences, correlation ID). Renderer uses actions hooks + Facade only.

3. **Active session lock:** if SIP is registered, Login is disabled with semantic reason (`account.signIn.disabled.logoutFirst` / localized tooltip «Необходимо выйти из аккаунта»). Facade **rejects** new identity attempts and **must not** silently unregister (`ensureUnregisteredBeforeAccountSwitch` removed from Account sign-in path).

4. **Logout:** only avatar user menu → existing logout flow (OCP reason modal + cascade when applicable). Account panel contains no logout control.

5. **Recovery UI (amended by ADR-AF-005):** no generic Account Retry. Canonical Server/Authorization status and recovery actions live in **Settings → Состояние системы → OCP tab**. Account may still show in-progress recovery during an unfinished OCP sign-in attempt. Integrations must not own Connect/Disconnect/Retry sign-in.

6. **OCP Module (post account session):** configuration editing only for the **active** profile:
   - enabled, autoConnect, OCP Domain, rotate/save/delete API key;
   - no Server/Authorization status ownership (System State OCP tab);
   - Changing settings that would invalidate a live OCP session requires an explicit Apply/Save action — never silent reconnect on blur.

7. **Copy:** primary button label is localized «Войти» (`account.action.signIn`), never «Авторизоваться».

## Alternatives Considered

| Alternative | Benefits | Risks | Why rejected |
|---|---|---|---|
| Keep Integrations as first-time OCP setup + Account for SIP | Less UI churn | Split ownership; duplicate Retry; gate fails | Conflicts with requirements 1/7 |
| Keep switch-account unregister-on-submit | Familiar F-024 path | Two live-session semantics; bypasses avatar logout | Intentional F-024 change |
| Allow Account logout for convenience | Short path | Two logout surfaces; OCP reason cascade drift | Forbidden |
| Put recovery only in Integrations | Separates status | Operator cannot recover from Account during sign-in | Violates Account ownership |

## Consequences

- **Positive:** one mental model; avatar-only logout; no silent identity replacement; OCP Module no longer signs in.
- **Negative:** removes switch-profile confirmation UX; operators must logout via avatar before another identity.
- **Testing:** Facade rejects active-session login without unregister; Account UI has no logout/switch/generic retry IDs; OCP Module lacks Connect/Disconnect/login picker; avatar logout cascade regression.
- **Migration:** deprecate Account/Integrations sign-in entry points after WU-03/WU-04/WU-05; update F-024 acceptance criteria to drop A→B unregister-on-submit.
- **Rollback:** restore dual surfaces only with a new ADR.

## Architecture Checks

- UI → Application → Domain → Ports → Adapters preserved.
- No ports/adapters/WebSocket in renderer.
- Domain stays framework-independent.
- Secrets never cross renderer-facing return types.

## Related Links

- Feature Registry: F-001, F-016, F-024, F-028
- Plan: `auth-flow/auth-flow-refactoring.md` (WU-03, WU-04, WU-05)
- Related ADRs: ADR-AF-001, ADR-AF-002, ADR-AF-004
- Prior handoff: `docs/softphone/handoffs/P11-Unified-Authorization-Gate-Handoff.md` (superseded for Account/Integrations sign-in ownership)
