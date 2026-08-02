# F-034 Acceptance

- Purpose: define the observable product, architecture, and non-regression completion gate.
- Inputs: implemented WUs, automated evidence, canonical docs, and release decision.
- Outputs: unambiguous pass/block result for F-034.

## Compatibility law

- [x] Default preferences present the same in-app toasts that shipped before F-034 for existing producers.
- [x] Journal still records when popups are disabled (`suppressedAtEmission`).
- [x] ADR-0013 critical raises still occur (incoming, outgoing, campaign, SDK attention, second instance).
- [x] Incoming call UI / campaign modal / SDK consent modal are not replaced by toast policy.
- [x] Toast viewport geometry tests remain green.
- [x] Call DND semantics unchanged.

## Preferences product

- [x] Settings → Notifications is a hub with Preferences, Appearance, and History.
- [x] Master “Show in-app popups” control exists and persists.
- [x] Per-module enabled + minLevel persist and affect presentation.
- [x] Appearance controls (placement/stacking/duration/maxVisible) work from the hub.
- [x] General panel does not duplicate appearance editors.
- [x] Raise defaults to never; enabling errors_only either works (WU-08) or control is absent/deferred without breaking defaults.

## Modules and tagging

- [x] Catalog includes at least prior modules plus `sdk`, `updates`, `externalServices` (or documented deferral if a module has zero producers on branch).
- [x] Existing producers supply `module` + `functionId` (no new silent `system` spam from touched paths).
- [x] OCP remote notifications use `interruptClass: remote` (or equivalent locked mapping).
- [x] History filters expose the expanded module list.

## Capture architecture

- [x] Presentation policy is evaluated in Application/Domain capture path, not ad hoc in random components.
- [x] ADR-0025 accepted.
- [x] Capture failure handling remains safe (no swallowed critical errors; journal IO keeps policy — no prefs bypass; unexpected throw last-resort fail-open documented/tested).
- [x] File size / layer budgets respected on touched modules.

## Portability and persistence

- [x] Schema migration N→N+1 preserves prior notification appearance + popup master behavior.
- [x] F-030 export/import round-trips notification preferences; journal excluded.
- [x] Invalid settings/import fail closed.

## Security / isolation

- [x] Journal redaction unchanged or stricter.
- [x] No HTML execution of OCP bodies.
- [x] No default focus-stealing raises for informational toasts.
- [x] SDK-hide not broken by success/info presentation.

## Optional WUs

- [x] WU-08 done **or** deferred with PROGRESS reason.
- [x] WU-09 done **or** deferred with PROGRESS reason.

## Non-regression surfaces

- [x] SIP-only staged sign-in toasts still correct (no false “registered” claims).
- [x] Headset fault toasts still surface under defaults.
- [x] OCP wire sticky/position/time/deleted/blocked ignored; toast duration/placement from Softphone prefs.
- [x] Contacts/history CSV toasts still surface under defaults.
- [x] Update banner / non-toast update UX unchanged unless explicitly tagged updates toasts exist.
- [x] External Services / SDK / OCP wire paths unchanged.

## Docs and gates

- [x] Feature Registry F-034 evidence paths valid (`npm run registry:check`).
- [x] STATUS / TASK-QUEUE / handoff closed consistently.
- [x] I18N parity for touched keys (`npm run i18n:check`).
- [x] UI catalog check if components registered.
- [x] Full preflight commands from `08-TESTING.md` pass.
- [x] SemVer/CHANGELOG/manifest updated **only** if user authorized a release cut.

## Release recommendation

- User-visible Notification Center ⇒ **MINOR** bump when shipping.
- If only internal policy refactor with identical UX and no Preferences UI yet, do not ship a version bump mid-track.
- **Ship decision:** deferred pending explicit user `/release` authorization (no SemVer bump in WU-10).
