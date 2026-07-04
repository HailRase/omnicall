# ADR-0006: Interface Internationalization Foundation

## Status

Accepted (2026-07-04)

## Context

Renderer UI is Russian-only and contains hardcoded strings in components, helpers, icon labels, and settings shells. Product now requires `ru`, `en`, `fr`, and `de` with immediate language switch, per-user persistence via `UserSettings`, typed translation keys, and compile/test coverage for all supported locales. Domain boundaries must stay unchanged: no Domain dependency on renderer i18n/runtime.

## Decision Drivers

- Keep architecture boundaries from `Architecture-Constitution.md`.
- Ensure typed translation keys and locale coverage safety.
- Support interpolation without untyped payloads.
- Apply language immediately at runtime without app restart.
- Minimize moving parts and dependency risk for current phase.

## Considered Options

### Option A — Typed in-repo catalog + lightweight runtime (chosen)

- `src/renderer/i18n/messages.ts` as typed key catalog (`ru`, `en`, `fr`, `de`).
- Renderer runtime with `setRendererLanguage` / `useI18n` and typed `t(...)`.
- Compile-time key coverage (`en` typed against `ru` schema) + test-time parity check.
- Interpolation via typed message function parameters.

### Option B — `i18next` + `react-i18next`

- Mature ecosystem and pluralization support.
- Adds runtime dependency, provider wiring, and adapter surface larger than current scope.
- Requires broader migration and operational policy before foundation is stable.

### Option C — Inline no-framework translators per module

- Small local changes, zero shared runtime.
- No single source of truth for keys, weak consistency, harder locale coverage enforcement.
- High drift risk across modules and tests.

## Decision

Adopt Option A. We introduce a typed in-repo translation catalog and a minimal renderer runtime. `UserSettings` schema moves to v2 with `language: SupportedLanguage` (`ru` default; supported locales `ru`, `en`, `fr`, `de`). Renderer translates presentation copy; Domain remains semantic/technical (reason keys, events, enums). Application projections prefer semantic keys/params where user copy originates from state.

## Consequences

- New UI or UI-facing logic must add/update keys for every supported locale.
- Tests cover locale parity and critical surfaces in both languages.
- Rule `i18n.mdc` becomes mandatory for UI/Application work.
- Existing Russian-only policy in UI docs/rules is replaced by explicit multi-locale policy.
