# F-031 Acceptance

- Purpose: define the observable product, architecture, security, and non-regression completion gate.
- Inputs: implemented WUs, automated evidence, canonical docs, and release decision.
- Outputs: unambiguous pass/block result for F-031.

## Product behavior

- [ ] External Services is an authenticated-profile child under Settings → Integrations, beside OCP.
- [ ] OmniCall Kit remains a separate top-level leaf.
- [ ] Collections support create, rename, delete, duplicate `(copy)`, enable, variables, import, and export.
- [ ] Collections show enabled-request count without drill-down.
- [ ] Requests are flat, have stable UUIDs, support CRUD, and show fast enabled state/toggle.
- [ ] Methods are exactly GET/POST/PUT/PATCH/DELETE.
- [ ] Query and headers use key/value tables.
- [ ] Body modes are exactly none/json/x-www-form-urlencoded/raw.
- [ ] Collection and request must both be enabled for automatic fire.
- [ ] No hard count limit or nested folder exists.

## Triggers and variables

- [ ] All ten automatic stable codes and `manual_run` are implemented exactly.
- [ ] Missed and rejected are independent switches/facts.
- [ ] Hold/mute/register/OCP session/SDK/transfer-specific triggers do not exist.
- [ ] Every call trigger, including ringing, is evaluated against focused call at event time.
- [ ] Non-focused ringing/answered/ended/rejected/missed/ACD does not fire.
- [ ] Rapid two-line incoming scenarios are deterministic and tested.
- [ ] Re-invite/hold/resume cannot emit false ringing/connecting.
- [ ] `{{name}}` resolves in URL/query/headers/body.
- [ ] Missing variable becomes literal `undefined`.
- [ ] Required base, call, campaign, and safe ACD variables map from typed facts.
- [ ] No raw OCP wire IDs/secrets are exposed.

## Execution

- [ ] Trigger publication/call path never awaits HTTP, queue, journal, or UI.
- [ ] Queue is FIFO with maximum three in flight.
- [ ] Every matching eligible request is enqueued.
- [ ] Timeout is fixed at 10 seconds.
- [ ] No retry, offline replay, backlog persistence, scripts, chaining, or response command exists.
- [ ] Deleting/disabling drops pending starts for stale IDs; in-flight attempts finish.
- [ ] Logout/profile switch cancels old pending jobs; old in-flight jobs finish to old journal.
- [ ] HTTP and HTTPS, including localhost/LAN/private IPs, are allowed.
- [ ] Main transport validates/bounds redirects, request, response, timeout, and IPC.

## Manual Run

- [ ] Run now uses the same queue/transport/journal path and `manual_run`.
- [ ] Disabled definitions can run manually when they still exist.
- [ ] Result always shows duration and status when available.
- [ ] 2xx is success; non-2xx is error while body remains visible.
- [ ] Network/DNS/timeout/abort/validation are distinct structured errors.
- [ ] Invalid substituted JSON warns but sends unchanged.
- [ ] Response body truncation is indicated.

## Journal and security

- [ ] Journal is per profile, newest-first in UI, and capped at latest 100.
- [ ] Response bodies persist/display at maximum 16 KiB.
- [ ] Authorization/Cookie/X-Api-Key values are `***` case-insensitively before persistence.
- [ ] Logs contain required correlation/identity fields without URL values, headers, bodies, phone numbers, or tokens.
- [ ] UI renders response text without HTML execution.
- [ ] Responses cannot call facade, Call Engine, OCP, SDK, headset, or navigation commands.
- [ ] F-011 snapshots/events/capabilities expose no F-031 config or journal.

## Persistence and portability

- [ ] Empty profile defaults are inert.
- [ ] `UserSettings` migration v11→v12 preserves existing settings.
- [ ] Profile A config and journal are invisible to profile B.
- [ ] F-030 export/import round trips External Services config into active target profile.
- [ ] F-030 excludes journal and preserves existing SIP/OCP/SDK/device secret exclusions.
- [ ] Successful F-030 import refreshes runtime without restart; invalid import does not mutate.
- [ ] Single-collection versioned JSON round trips, regenerates IDs on import, and rejects unknown versions.

## UI, i18n, and accessibility

- [ ] Collections, requests, editor, Run result, and Journal implement empty/loading/error/disabled states.
- [ ] Existing UI Kit primitives are reused; no duplicate local generic kit exists.
- [ ] New CSS is modular, token-based, light/dark compatible, and reduced-motion safe.
- [ ] All visible copy/labels/errors/placeholders/icon labels use typed i18n keys.
- [ ] Key parity passes for ru/en/fr/de/bg.
- [ ] Keyboard/focus/dialog/form labels and status semantics pass tests.
- [ ] Critical surfaces have light/dark Storybook evidence.

## Architecture

- [ ] ADR-0022 is accepted and implementation matches it.
- [ ] Domain imports no React/Electron/Node/browser/Zustand/storage/infrastructure.
- [ ] UI imports no Domain/ports/adapters/repositories/raw IPC.
- [ ] Store is projection-only.
- [ ] Application owns orchestration; main/adapters own technology.
- [ ] No Call Engine, SIP state, OCP wire, SDK command, headset, or transfer behavior changed.
- [ ] SIP-only bootstrap works with no External Services configured.
- [ ] No `any`, `@ts-ignore`, `as unknown as`, or deprecated API exists in touched code.
- [ ] File/function/component/hook budgets are met.

## Documentation and gates

- [ ] F-031 registry evidence is complete and status is truthful.
- [ ] STATUS, TASK-QUEUE T-052, master handoff, ADR, I18N coverage, F-030 design, and PROGRESS agree.
- [ ] Every completed WU has a work-history entry.
- [ ] Focused and full test/typecheck/lint/i18n/registry/preflight gates pass.
- [ ] SemVer/release handling follows `version-release.mdc` and explicit user authorization.
