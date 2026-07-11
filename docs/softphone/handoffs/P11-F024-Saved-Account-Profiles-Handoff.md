# P11 F-024 Saved SIP Account Profiles (Quick Sign-In) Handoff

- Scope: **F-024** saved SIP account profiles for quick sign-in; extends **F-023** per-account settings persistence.
- Legacy: **LF-077** (saved profile list + per-account settings on authorize).
- Remember-password: optional «Remember password on this PC» via `SecretStoragePort` (secure storage only; never in saved-profiles JSON).

## Delivered

| Area | Path |
| --- | --- |
| Design context | `docs/softphone/P11-Local-Account-Profiles-Design.md` |
| Domain | `src/domain/settings/SavedAccountProfile.ts`, `persistedSavedAccountProfiles.ts`, `formatSavedAccountProfileSelectorLabel.ts`, `matchesSipAccountIdentity.ts` |
| Application | `SaveAccountProfileUseCase`, `ListSavedAccountProfilesUseCase`, `DeleteSavedAccountProfileUseCase`, `TouchSavedAccountProfileUseCase` |
| Projections | `deriveSavedAccountProfileSelectorOptions.ts`, `deriveSavedProfilePanelMode.ts`, `deriveSavedProfileCredentialPromptState.ts`, `mapAccountAuthorizationError.ts`, `sanitizeRegistrationServerMessage.ts`, `resolveAccountAuthorizeTargetIdentity.ts` |
| Port | `src/ports/settings/SavedAccountProfileRepository.ts` |
| Adapters | `InMemorySavedAccountProfileRepository.ts`, `FileSavedAccountProfileRepository.ts`, `profileStoragePaths.ts` |
| Bootstrap | `createRealBootstrapSavedAccountProfileRepository.ts`, `createMockAccountBootstrap.ts`, `createRealAccountBootstrap.ts` |
| Facade | `AccountBootstrapFacade.ts` — `authorizeManualAccount`, `authorizeSavedAccountProfile`, `deleteSavedAccountProfile`, `forgetRememberedSipPassword`, `ensureUnregisteredBeforeAccountSwitch`, metadata non-blocking |
| UI | `SavedAccountProfileSelector.tsx`, `DeleteSavedAccountProfileConfirmationModal.tsx`, `SwitchSavedAccountProfileConfirmationModal.tsx`, `AccountPanel.tsx`, `SettingsAccountPanel.tsx` |
| Hooks | `useAccountActions.ts`, `useSettingsActions.ts` |
| i18n | `src/renderer/i18n/messages.ts` — `account.profile.*`, `account.error.*`, `account.warning.*` (ru/en/fr/de/bg) |

## Authorize flow (saved profile)

```txt
SettingsAccountPanel → useAccountActions → facade.authorizeSavedAccountProfile(id, password)
  → ensureUnregisteredBeforeAccountSwitch (if registered + different identity)
  → authorizeSipAccount → registerAccount
  → applyActiveProfileSettingsSideEffects (after successful register)
  → touchSavedAccountProfile (non-blocking metadataWarning)
```

## F-024 Gate

- [x] Tab navigation («New» first) + keyboard-accessible tablist
- [x] Password-only panel for unauthenticated saved tab (or Sign in only when remembered password exists)
- [x] Remember-password checkbox + secure storage; forget remembered password; failed remembered sign-in reveals password field
- [x] New tab save-profile checkbox + duplicate guard
- [x] Switch A→B: unregister before register (submit only)
- [x] Metadata save/touch non-blocking (`metadataWarning`)
- [x] Server 403/404 → sanitized detail, not wrong password
- [x] Local missing profile → `account.error.profileNotFound`
- [x] Delete confirmation; logout → New tab
- [x] Password never in JSON/logs/tests
- [x] Settings apply only after successful registration
- [x] Feature Registry F-024 → implemented
- [x] LF-077 evidence updated in Legacy-Feature-Coverage
- [x] i18n parity ru/en/fr/de/bg; `i18n:check` PASS
- [x] UI catalog synced (`SavedAccountProfileSelector`, modals)

## Verification

```bash
npm run test && npm run lint && npm run typecheck && npm run i18n:check && npm run registry:check && npm run ui:catalog:check
```

Baseline pre-F-024 **1189** → **1274** at gate close (`0a2ae05`); post-gate follow-ups (remember-password UX, auth-loop fix) → **1727 tests passed**, 1 skipped (verified 2026-07-11).

## Post-gate follow-ups (2026-07-07 — 2026-07-08)

| Fix | Path |
| --- | --- |
| Remember-password UX (hide password field when stored) | `deriveSavedProfileCredentialPromptState.ts`, `AccountPanel.tsx`, `useAccountActions.ts` |
| Auth-loop regression (stable identity key in effect deps) | `useAccountActions.ts`, `useAccountActions.test.ts` |

## Manual smoke (verified 2026-07-06; remember-password UX 2026-07-08)

- [x] Save profile on New tab → re-open Settings → profile tab appears.
- [x] Select saved tab while logged out → password-only + Sign in (or Sign in only when password remembered).
- [x] Remembered password sign-in → failed auth reveals password field without clearing profile tab.
- [x] Switch registered profile A → B → confirm modal → B registers; failed auth does not apply target settings.
- [x] Delete saved profile → confirm → selection returns to New.
- [x] SIP 403/404 → server detail banner, not «wrong password».

## STOP

Do not start P10 headset or P11 UI-6 Radix until next WU prompt.

## Next

- **P10 WU1:** Headset domain foundation — T-004 — `/logic`
- P11 polish: UI-6 Radix modals — `/ui`
