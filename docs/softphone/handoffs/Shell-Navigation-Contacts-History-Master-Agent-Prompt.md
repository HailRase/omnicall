# AGENT MASTER PROMPT: Shell Navigation, Contacts, And History

> Use this prompt for a staged, production-ready navigation expansion in the Electron React softphone. Do not implement it as a single big-bang change.

## Documentation

- Purpose: guide safe shell navigation, contacts, and history implementation.
- Inputs: current architecture docs, Feature Registry, legacy IDs, existing shell code.
- Outputs: staged implementation, tests, handoffs, and user-visible change notices.

## Prime Directive

Preserve every existing implemented behavior. The current call, registration, settings, notification, update, multi-call, and overlay flows must keep working after every step.

If any current behavior, architecture document, route model, dependency, data shape, test contract, or UX rule must change, stop before coding and inform the user:

- what changes
- why the change is necessary
- what alternatives exist
- what files/contracts are affected
- what regression checks will prove nothing broke

Do not silently replace the current shell model.

## Mandatory Read Order

1. `docs/softphone/MASTER_SYSTEM_PROMPT.md`
2. `docs/softphone/STATUS.md`
3. `docs/softphone/Architecture-Constitution.md`
4. `docs/softphone/UI-Architecture.md`
5. `docs/softphone/UX-UI-Design-Blueprint.md`
6. `docs/softphone/UI-Design-System.md`
7. `docs/softphone/Feature-Registry.md`
8. `docs/softphone/Legacy-Feature-Coverage.md`
9. `docs/softphone/Implementation-Roadmap.md`
10. Existing handoffs for P11 shell/settings/call UI.

## Required Skills

- `.cursor/skills/scope-intake/SKILL.md`
- `.cursor/skills/implementation-phase-planning/SKILL.md`
- `.cursor/skills/feature-slice-design/SKILL.md`
- `.cursor/skills/ux-ui-flow-design/SKILL.md`
- `.cursor/skills/softphone-architecture-review/SKILL.md`
- `.cursor/skills/legacy-feature-migration/SKILL.md` when legacy behavior is touched.

## Baseline Facts

- Current UI architecture is shell-first: `App` -> `SoftphoneReadyShell` -> `SoftphoneLayout`.
- Current layout zones are Header, Context, Controls, and Overlay.
- Current settings UI is an overlay and must not unmount call context during established calls.
- Current docs explicitly prefer a small panel model over route-heavy navigation.
- No router dependency is currently assumed.
- `F-013: Call History` exists.
- Contacts are not currently visible as a registered product feature; create or update Feature Registry before implementation.

## Target Architecture

Use a desktop navigation model, not a browser-page mental model:

```txt
App
  -> bootstrap / shutdown / ready guard
  -> SoftphoneReadyShell
     -> ShellNavigationController
     -> SoftphoneLayout
        -> HeaderZone: status, user menu, global actions
        -> ContextZone: call lines, incoming/active call context, errors
        -> ControlsZone: dialpad and active controls
        -> MainPanelZone: idle-safe panels such as contacts/history
        -> OverlayLayer: incoming banners, settings, diagnostics, notifications, modals
```

Call state is global application state. It must not be owned by a route or page.

## Route-Driven Sidebar Rule

Contacts navigation is route-driven, but its default visual form is a sidebar/overlay on top of the dialpad and call shell.

Required behavior:

- `/contacts`, `/contacts/:contactId`, and `/contacts/:contactId/edit` or their typed-route equivalents select contact UI state.
- The dialpad/call surface remains mounted behind the contacts sidebar.
- `ContextZone`, `ControlsZone`, call projections, incoming call UI, active call controls, notifications, and settings overlays must not remount because contact routes change.
- Contact list/details/edit must render in `OverlayLayer` or a dedicated shell sidebar slot, not as an arbitrary full-page replacement.
- Full-panel contacts are allowed only after explicit user approval and only if active call context remains visible.
- Invalid or missing `contactId` shows a not-found state inside the sidebar and must not crash or redirect through business logic.
- Incoming calls must appear above or alongside the contacts sidebar with usable answer/reject controls.
- On answer, the agent must implement one explicit UX rule: either keep the sidebar open or close/focus the dialpad. Do not improvise per component.

## Navigation Strategy

Implement one of these only after discovery:

### Option A: Typed Internal Navigation State

Use this when URL/deep-link/back-forward behavior is not needed yet.

```ts
type ShellRoute =
  | { name: "dialpad" }
  | { name: "settings"; section?: SettingsSectionId }
  | { name: "contacts" }
  | { name: "contactDetails"; contactId: ContactId }
  | { name: "contactEdit"; contactId: ContactId }
  | { name: "history" };
```

Rules:

- Keep it in a dedicated shell navigation hook, not scattered `viewMode` flags.
- Parse and validate all route params.
- Do not store business data in the route.
- Render contact routes through the route-driven sidebar rule.
- Preserve settings as overlay when a call is active.

### Option B: Real Router

Use this only if the user approves a route model change and dependency choice.

Allowed candidates:

- React Router for simple stable routing.
- TanStack Router for strongly typed route trees.

Rules:

- Prefer `HashRouter` or memory/history adapter suitable for Electron.
- Keep `SoftphoneLayout` and `CallOverlayLayer` mounted across route changes.
- Routes may select screens; routes must not execute telephony business logic.
- Contact routes must render as shell sidebars/overlays by default, not full-page replacements.
- Document and test behavior for direct entry, invalid params, and app restore.
- Update `UI-Architecture.md` / `UX-UI-Design-Blueprint.md` or create an ADR if this replaces the small panel model.

## Non-Negotiable Call UX

- Incoming call UI must appear globally, regardless of current screen.
- If user is editing a contact, viewing history, or changing settings, incoming call remains visible and actionable.
- Answer/reject must go through `AnswerCallUseCase` / `RejectCallUseCase` via existing actions/facade bindings.
- After answer, navigation may move to the dialpad/call surface, but call state must be driven by projections.
- Active call context must never disappear because a contact/history/settings screen is open.
- History and contacts can be full-panel only when idle or when call context remains visible.

## Implementation Phases

### Phase 0: Discovery And Safety Plan

Do not write production code yet.

Deliver:

- list current files owning shell, overlays, settings, calls, notifications, history
- list affected `F-XXX` and `LF-XXX`
- identify whether contacts need a new `F-XXX`
- identify current test baseline
- identify whether Option A or Option B is recommended
- list exact user-visible behavior changes

Stop and ask the user before changing the documented navigation model or adding router dependencies.

### Phase 1: Navigation Foundation

Goal: introduce navigation without product feature changes.

Deliver:

- `ShellNavigationController` or `useShellNavigation`
- typed route union or approved router setup
- route guards for active-call-sensitive panels
- invalid route fallback to dialpad
- tests for route transitions
- no changes to telephony Domain/Application behavior

Gate:

- dialpad/call surface still works
- settings overlay still works
- notifications still render
- incoming/active call overlays remain mounted
- no existing tests fail

### Phase 2: History Panel Integration

Goal: move or expose `F-013: Call History` through the new navigation model.

Deliver:

- route/panel entry for history
- projection-driven history list
- redial/call-from-history through existing or new Use Case only
- idle/active-call UX rules
- i18n keys for all visible labels
- tests for empty, loading, populated, error, active-call, and redial states

Do not read repositories from React. UI consumes projections and emits callbacks.

### Phase 3: Contacts Domain Slice

Goal: add contacts as a real feature, not only a UI page.

Before code:

- add Feature Registry entry for contacts
- map legacy IDs if this replaces legacy behavior; otherwise document no legacy mapping
- define bounded context, likely `Operator` or `Settings` depending on product ownership
- define contact identity, validation rules, and persistence requirements

Deliver in order:

1. Domain types/value objects: `Contact`, `ContactId`, phone fields, display name validation.
2. Domain events if contact changes are business events.
3. Application Use Cases: list, get, create, update, delete, call contact.
4. Ports: `ContactRepository`.
5. Mock/in-memory adapter tests first.
6. Projection/read model for renderer.
7. Facade methods and shell actions.
8. UI screens only after the above exists.

Never start contacts by creating `ContactPage.tsx` first.

### Phase 4: Contacts UI

Goal: implement screens on top of the completed contact slice.

Routes/panels:

- contacts list as sidebar/overlay over dialpad
- contact details as sidebar/overlay over dialpad
- contact edit as sidebar/overlay over dialpad

UX states:

- empty list
- loading
- validation errors
- save success/failure
- not found
- delete confirmation
- active call present
- incoming call while editing
- call contact disabled reason

Rules:

- contact routes must follow the route-driven sidebar rule
- components are presentational
- shell hooks map projections to props
- actions hooks call facades/Use Cases
- no repository, SIP, Electron, adapter, or Domain imports in components
- all visible text through i18n catalogs: `ru`, `en`, `fr`, `de`, `bg`
- CSS Modules with semantic tokens only
- UI Kit primitives for buttons, inputs, dialogs, forms, tabs, badges, cards, overlays

### Phase 5: Settings Route/Overlay Alignment

Goal: make settings addressable without breaking the call-center overlay rule.

Rules:

- `/settings` or equivalent navigation may open settings overlay.
- If a call is active, settings must remain overlay/sheet behavior.
- Closing settings returns to previous safe shell destination.
- Settings section IDs must be validated.
- Config writes continue through facade -> port -> projection refresh.
- No Use Case for pure config flags unless business rules appear and ADR approves it.

### Phase 6: Regression Hardening

Deliver:

- route/navigation tests
- shell overlay tests
- contacts use case tests
- repository tests
- renderer tests for critical UI states
- i18n parity check
- lints/typecheck
- manual smoke checklist

**Status (2026-07-07):** closed — see `handoffs/Shell-Navigation-Phase6-Smoke-Checklist.md` and work-history.

Required commands:

```bash
npm run test
npm run lint
npm run typecheck
npm run i18n:check
npm run ui:catalog
```

Run focused tests during development, then full checks at the gate.

## Architecture Boundaries

- UI renders projections and emits callbacks.
- Hooks compose selectors, shell state, and action bindings.
- Zustand stores are projections only.
- Application owns orchestration.
- Domain owns contact/call/history rules.
- Ports define repositories/gateways.
- Adapters implement persistence or external APIs.
- Electron main/preload own platform behavior only.
- No `any`, `@ts-ignore`, `as unknown as`, deprecated APIs, or raw untyped payloads.

## User Notification Rules

Inform the user before proceeding if:

- adding a router dependency
- replacing current small panel navigation docs
- changing `SoftphoneLayout` zone responsibilities
- changing settings from overlay to route page
- changing incoming call presentation
- introducing persisted contacts schema
- adding or changing IPC channels
- changing call history storage semantics
- updating public host/integration contracts
- removing, renaming, or weakening existing tests

## Anti-Patterns

- `viewMode` plus scattered IDs and booleans.
- Route owns active call state.
- Contact edit state stored globally without lifecycle.
- UI imports repository, adapter, Electron, SIP, Domain, or Use Case directly.
- Settings replaces call screen during an established call.
- Contacts replace the dialpad/call shell as an unapproved full-page route.
- A router provider remounts call projections or overlays.
- New feature without Feature Registry entry.
- UI copy hardcoded in components.
- Hidden fallbacks for corrupted persisted data.
- Big-bang refactor of shell, contacts, history, and settings in one commit.

## Completion Gate

The work is complete only when:

- implementation is split into safe staged work units
- Feature Registry and Legacy Coverage are current
- existing call/settings/notification/update flows are regression-tested
- incoming call works from every new screen
- answer navigates or focuses call surface without losing call state
- contact routes render as sidebar/overlay over the mounted dialpad/call shell unless an approved design says otherwise
- contacts and history are projection-driven
- i18n parity passes for all supported locales
- full test/lint/typecheck suite is green
- handoff and work-history are written

## Final Response Contract For The Agent

Report in Russian:

- what was implemented
- which features and legacy IDs were affected
- which current behavior was intentionally changed, if any
- which checks passed
- remaining risks or deferred items
- work-history path

