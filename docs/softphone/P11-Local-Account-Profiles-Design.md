# P11 Local Account Profiles Design

Related: **F-023**, **F-016**, **F-001**, **LF-077**, **LF-076**, **LF-082**, **LF-084**. Phase: P11 (Settings / Integration).

## Problem

Operators may share one PC but use different SIP accounts. Settings must persist **per account identity** on disk, switch on authorization, and never overwrite another account's profile. SIP-only and mock bootstrap flows must remain deterministic.

## Current state (2026-07-06)

| Area | Status |
| --- | --- |
| `UserSettings` v3 + migration | Done (`migrateUserSettings`, `validateUserSettings`) |
| Per-account API on port | Done (`getUserSettings` / `saveUserSettings` by `SettingsAccountKey`) |
| Account key derivation | **Partial** — username-only via `resolveSettingsAccountKeyFromSipAccount` |
| `InMemorySettingsRepository` | Per-account map in memory; single `sipAccount` slot |
| `FileSettingsRepository` | **Done** — disk persistence via `FileSystemPort` + `profiles/index.json` + `settings/{key}.json` |
| Real bootstrap | **Done** — `FileSettingsRepository` wired in `createRealAccountBootstrap` + main IPC path injection |
| Authorize flow | Saves one global `sipAccount`; no profile switch + settings reload |
| Credential persistence | **Optional** — `SecretStoragePort` + Electron `safeStorage` IPC (remember-password) |
| Secret storage port | **Implemented** — `SecretStoragePort`, `PreloadSecretStorageAdapter`, main IPC |

## Goals

1. Deterministic profile key from normalized SIP identity (no password in key).
2. Disk persistence under app user-data via injected filesystem boundary.
3. Active profile metadata separate from per-account `UserSettings`.
4. Authorize account B → load B settings; return to A → restore A settings.
5. Preserve `UserSettings` v3 migration; migrate legacy single-bucket data once.
6. Mock/tests keep in-memory repository; renderer never touches filesystem.

## Non-goals (this track)

- legacy operator platform multi-agent identity beyond SIP username alias (existing legacy operator platform path unchanged).
- Cloud sync or server-side profile storage.

## Profile key (`SettingsAccountKey`)

Derived in Domain only.

| Rule | Decision |
| --- | --- |
| Base identity | `normalize(username)@normalize(domain)` — lowercase, trimmed |
| Server suffix | Append `|{normalizeServerHost}` when server host ≠ domain (same AOR, different PBX) |
| Password | Never included |
| Anonymous / dev | `__anonymous__` (unchanged) |
| Collision | Same key → same profile; different server host → different profile |

Normalization helpers live in `src/domain/settings/` (pure functions, unit-tested).

## Persistence layout

Injected root: `{userData}/axatalk/profiles/` (exact path from Electron main or test temp dir).

```txt
profiles/
  index.json              # activeProfileKey + profile metadata (no secrets)
  settings/
    {profileKey}.json     # UserSettings v3 per profile
```

### `index.json` (schema v1)

- `schemaVersion: 1`
- `activeProfileKey: SettingsAccountKey | null`
- `profiles: Record<SettingsAccountKey, LocalAccountProfileMetadata>`
  - `username`, `domain`, `server`, `uri`, `lastAuthorizedAt` (ISO string)
  - **No password**

### Write semantics

- Settings save: atomic write (`*.tmp` → rename) for `{profileKey}.json` only.
- Index update: atomic write on authorize / profile switch.
- Corrupt file: classified error (`settings_corrupt:*`); index corruption → safe defaults + log (no silent wipe of other profiles).

## Port extensions

Extend `SettingsRepository` only where application needs are explicit:

| Method (proposed) | Purpose |
| --- | --- |
| `getActiveProfileKey()` | Current settings bucket |
| `setActiveProfileKey(key)` | Switch active profile on authorize |
| `listKnownProfileKeys()` | Optional UI / migration |
| Existing `getUserSettings` / `saveUserSettings` | Unchanged contract |

Keep `getSipAccount` / `saveSipAccount` for **active session** telephony; metadata also mirrored in index for re-auth without password.

## Secret handling (Step 5 decision — locked)

**Path A (shipped): session-transient SIP passwords.**

| Aspect | Behavior |
| --- | --- |
| SIP password | Lives in memory on `SipAccount` for active session only; **never** written to profile JSON |
| Profile JSON | `UserSettings` v3 only — no credential fields in schema |
| Index JSON | `activeProfileKey` only — no username/password metadata yet (Step 6) |
| Defense in depth | `assertPersistedProfileJsonExcludesSecrets` scans JSON before atomic write |
| Remember-me | **Not supported** until secure storage lands |

**Path B (implemented):** optional remember-password via `SecretStoragePort` + Electron `safeStorage` + typed IPC.

| Aspect | Behavior |
| --- | --- |
| SIP password (optional) | Encrypted via `safeStorage` in main process; scope key = profile/settings account key |
| Profile JSON | metadata only — no credential fields |
| Remember-me UX | «Remember password on this PC» in account settings; enabled when saving/selecting a profile |
| Remembered sign-in | Saved tab with remembered password shows **Sign in** + **Forget remembered password** only; no password field; explicit operator action (no silent app-start auto-login) |
| Forget remembered password | Deletes only local secure secret via `SecretStoragePort`; profile metadata and per-account settings retained |
| Active session display | When registered saved profile tab shows full form, password field may display active in-memory session password (not loaded from secure storage for inactive profiles) |
| Delete profile | removes encrypted secret blob |
| Logout | clears session only; remembered password retained |

## Application orchestration

On successful `AuthorizeSipAccountUseCase`:

1. Derive `profileKey` from authorized account.
2. `setActiveProfileKey(profileKey)` + upsert index metadata.
3. Load `UserSettings` for `profileKey` (defaults if missing).
4. Refresh projections: theme, language, multi-call, auto-answer, SIP recovery, codec prefs.
5. `saveSipAccount(account)` for telephony session (password in memory only — see Secret handling).

`authorizeManualAccount` in facade must call settings refresh after register path.

Logout: clear active session; optional keep index entry (settings retained).

## Migration

1. **Legacy username-only keys:** on read via `loadUserSettingsWithLegacyMigration` (Application), if composite bucket is missing but legacy username-only bucket exists, copy once to composite key (logged `settings_profile_key_migrated`); username-only `activeProfileKey` in index is upgraded when migration runs.
2. **First disk migration:** if only anonymous in-memory defaults existed, no-op.
3. **Single global settings file** (future legacy): import into active profile key on first authorize.
4. **Index metadata expansion** (deferred): full `profiles` map migration in `index.json` when Step 6 metadata lands — current scope only rewrites `activeProfileKey` during username→composite migration.

## Composition

| Mode | Repository |
| --- | --- |
| Tests / Storybook / mock bootstrap | `InMemorySettingsRepository` |
| Real Electron | `FileSettingsRepository` + injected `UserDataPaths` / `FileSystemPort` |
| Renderer | Facade only — no filesystem |

Wire in `createRealAccountBootstrap` (or main-process bootstrap factory) — not in renderer.

## UI (Step 8, minimal)

- Settings account section embeds SIP authorization form only; profile persistence is transparent to the operator.

## Implementation steps

| Step | Scope | Key deliverables |
| --- | --- | --- |
| 1 | Discovery | F-023 registry, this doc, LF-077 alignment — **done** |
| 2 | Domain | `deriveSettingsAccountKeyFromIdentity`, normalization tests — **done** |
| 3 | Ports | Active profile on `SettingsRepository`, `InMemorySettingsRepository` + tests — **done** |
| 4 | Adapter | Real `FileSettingsRepository` + temp-dir tests, corrupt JSON — **done** |
| 5 | Secrets | Path A: transient passwords + `SecretStoragePort` contract + JSON guard — **done** |
| 6 | Application | Authorize/switch/restore integration tests on facade |
| 7 | Composition | Wire real mode; mock unchanged — **done** |
| 8 | UI | Profile label in settings account panel + tests if touched |
| 9 | Migration | Username→composite key; v3 preserved — **done** |
| 10 | Verification | `test`, `lint`, `typecheck`, `i18n:check`, `registry:check` — **done** |

## Required tests (acceptance)

- Domain key derivation (trim, case, server suffix, anonymous, collision).
- Per-account isolation in `InMemorySettingsRepository`.
- `FileSettingsRepository` persistence across new instances (temp directory).
- Corrupt JSON handling.
- Active profile switch; A → B → A settings restore.
- Save after switch writes only active profile bucket.
- Secret storage (if Step 5 implements credentials).
- Facade authorize/load/save/switch integration.
- Renderer tests only for changed UI.

## Architecture boundaries

```txt
UI → Application (facade, use cases) → Domain (key, UserSettings)
  → Ports (SettingsRepository, SecretStoragePort)
  → Adapters (FileSettingsRepository, InMemory, Electron secret)
  → Infrastructure (paths, fs, IPC, main process)
```

## Risks

| Risk | Mitigation |
| --- | --- |
| Username-only key change breaks existing saves | One-time migration on read |
| Real mode writes before Electron paths exist | Inject paths from main; unit tests use temp dirs |
| Authorize without settings refresh | Facade integration tests (Step 6) |
| Password in JSON | Explicit ban; code review + adapter tests |
