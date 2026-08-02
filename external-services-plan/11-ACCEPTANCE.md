# F-031 Acceptance

- Purpose: define the observable product, architecture, security, and non-regression completion gate.
- Inputs: implemented WUs, automated evidence, canonical docs, and release decision.
- Outputs: unambiguous pass/block result for F-031.

## Product behavior

- [x] External Services is an authenticated-profile child under Settings → Integrations, beside OCP.
- [x] OmniCall Kit remains a separate top-level leaf.
- [x] Collections support create, rename, delete, duplicate `(copy)`, enable, variables, import, and export.
- [x] Collections show enabled-request count without drill-down.
- [x] Requests are flat, have stable UUIDs, support CRUD, and show fast enabled state/toggle.
- [x] Methods are exactly GET/POST/PUT/PATCH/DELETE.
- [x] Query and headers use key/value tables.
- [x] Body modes are exactly none/json/x-www-form-urlencoded/raw.
- [x] Collection and request must both be enabled for automatic fire.
- [x] No hard count limit or nested folder exists.

## Triggers and variables

- [x] All eleven automatic stable codes (including `post_call_processing`) and `manual_run` are implemented exactly.
- [x] Missed and rejected are independent switches/facts.
- [x] Hold/mute/register/OCP session/SDK/transfer-specific triggers do not exist.
- [x] Every call trigger, including ringing, is evaluated against focused call at event time.
- [x] Non-focused ringing/answered/ended/rejected/missed/ACD does not fire.
- [x] Rapid two-line incoming scenarios are deterministic and tested.
- [x] Re-invite/hold/resume cannot emit false ringing/connecting.
- [x] `{{name}}` resolves in URL/query/headers/body.
- [x] Missing variable becomes literal `undefined`.
- [x] Required base, call, campaign, and safe ACD variables map from typed facts.
- [x] No raw OCP wire IDs/secrets are exposed.
- [x] Request editor Variables tab lists the Domain system catalog with Insert into URL/Body and explains syntax, missing→`undefined`, system precedence over collection keys, and when-available group subtitles (`always` / `call` / `campaign` / `acd`).
- [x] URL / Params value / Headers value / Body fields open template autocomplete on `{{` (system + collection; each option shows kind · when; case-sensitive prefix filter; Enter/click inserts `{{name}}`; single `{` does not open).
- [x] Selected collection workspace shows a compact custom-variables preview (hint, example, `{{token}}` column).
- [x] Collection variables dialog blocks duplicate keys and empty-key-with-value; soft-warns on system-name collisions.

## Execution

- [x] Trigger publication/call path never awaits HTTP, queue, journal, or UI.
- [x] Queue is FIFO with maximum three in flight.
- [x] Every matching eligible request is enqueued.
- [x] Timeout is fixed at 10 seconds.
- [x] No retry, offline replay, backlog persistence, scripts, chaining, or response command exists.
- [x] Deleting/disabling drops pending starts for stale IDs; in-flight attempts finish.
- [x] Logout/profile switch cancels old pending jobs; old in-flight jobs finish to old journal.
- [x] HTTP and HTTPS, including localhost/LAN/private IPs, are allowed.
- [x] Main transport validates/bounds redirects, request, response, timeout, and IPC.

## Manual Run

- [x] Run now uses the same queue/transport/journal path and `manual_run`.
- [x] Manual Run now resolves always-group `user_login` from active profile (SIP username, else OCP authenticated login) and optional focused-call facts.
- [x] Disabled definitions can run manually when they still exist.
- [x] Result always shows duration and status when available.
- [x] 2xx is success; non-2xx is error while body remains visible.
- [x] Network/DNS/timeout/abort/validation are distinct structured errors.
- [x] Invalid substituted JSON warns but sends unchanged.
- [x] Response body truncation is indicated.

## Journal and security

- [x] Journal is per profile, newest-first in UI, and capped at latest 100.
- [x] Response bodies persist/display at maximum 16 KiB.
- [x] Authorization/Cookie/X-Api-Key values are `***` case-insensitively before persistence.
- [x] Logs contain required correlation/identity fields without URL values, headers, bodies, phone numbers, or tokens.
- [x] UI renders response text without HTML execution.
- [x] Responses cannot call facade, Call Engine, OCP, SDK, headset, or navigation commands.
- [x] F-011 snapshots/events/capabilities expose no F-031 config or journal.

## Persistence and portability

- [x] Empty profile defaults are inert.
- [x] `UserSettings` migration v11→v12 preserves existing settings.
- [x] Profile A config and journal are invisible to profile B.
- [x] F-030 export/import round trips External Services config into active target profile.
- [x] F-030 excludes journal and preserves existing SIP/OCP/SDK/device secret exclusions.
- [x] Successful F-030 import refreshes runtime without restart; invalid import does not mutate.
- [x] Single-collection versioned JSON round trips, regenerates IDs on import, and rejects unknown versions.

## UI, i18n, and accessibility

- [x] Collections, requests, editor, Run result, and Journal implement empty/loading/error/disabled states.
- [x] Existing UI Kit primitives are reused; no duplicate local generic kit exists.
- [x] New CSS is modular, token-based, light/dark compatible, and reduced-motion safe.
- [x] All visible copy/labels/errors/placeholders/icon labels use typed i18n keys.
- [x] Key parity passes for ru/en/fr/de/bg.
- [x] Keyboard/focus/dialog/form labels and status semantics pass tests.
- [x] Critical surfaces have light/dark Storybook evidence.

## Architecture

- [x] ADR-0022 is accepted and implementation matches it.
- [x] Domain imports no React/Electron/Node/browser/Zustand/storage/infrastructure.
- [x] UI imports no Domain/ports/adapters/repositories/raw IPC.
- [x] Store is projection-only.
- [x] Application owns orchestration; main/adapters own technology.
- [x] No Call Engine, SIP state, OCP wire, SDK command, headset, or transfer behavior changed.
- [x] SIP-only bootstrap works with no External Services configured.
- [x] No `any`, `@ts-ignore`, `as unknown as`, or deprecated API exists in touched code.
- [x] File/function/component/hook budgets are met. _(panel orchestrator split into `externalServicesPanel/*` composition hooks + builders; 2026-07-30)_

## Documentation and gates

- [x] F-031 registry evidence is complete and status is truthful.
- [x] STATUS, TASK-QUEUE T-052, master handoff, ADR, I18N coverage, F-030 design, and PROGRESS agree.
- [x] Every completed WU has a work-history entry.
- [x] Focused and full test/typecheck/lint/i18n/registry/preflight gates pass.
- [x] SemVer/release handling follows `version-release.mdc` and explicit user authorization.

## WU-12 gate notes (2026-07-30)

- Automated: `npm run test` **2886 passed** / 1 skipped; `typecheck` PASS; `lint` PASS; `i18n:check` PASS; `ui:catalog` PASS; `registry:check` **75/0**; release preflight body (test+lint+typecheck+registry) PASS after F-031 fixture/lint closeout.
- Residual cleared: `useExternalServicesPanel` split into `externalServicesPanel/*` (selection/queue/dialogs/workspace + builders).
- SemVer: MINOR `1.1.2` → `1.2.0` **pending explicit user ship authorization** (no tag/build/push/manifest sync in WU-12).
