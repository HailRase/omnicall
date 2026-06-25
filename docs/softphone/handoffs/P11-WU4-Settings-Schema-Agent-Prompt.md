# P11 WU4 — Settings Schema, Validation, And Migration Foundation

> **Миссия:** формализовать typed settings schema + versioned migration для per-user config (LF-077); подготовить repository/facade к расширению settings UX без Use Case для чистого config.
> **STOP** после gate WU4 — не строить полные settings panels (account/audio/theme) и не full user menu.

---

## ОБЯЗАТЕЛЬНО прочитать (порядок)

### Архитектура и продукт
1. `docs/softphone/UI-Architecture.md` — settings write path (config → facade → port)
2. `docs/softphone/Implementation-Roadmap.md` — P11 items 2–4 (schema, migration, repository)
3. `docs/softphone/handoffs/P11-WU3-Header-Collapsed-Handoff.md` — baseline **676 tests**
4. `docs/softphone/handoffs/P11-WU1-Settings-Overlay-Handoff.md` — existing `setMultiCallSettings` path
5. `docs/softphone/Feature-Registry.md` — **F-016**
6. `docs/softphone/Legacy-Feature-Coverage.md` — **LF-076**, **LF-077**, **LF-033** (RBT), **LF-016** (auto-answer)

### Legacy reference (audit only — не копировать `setUserConfig` в UI)
`D:\Axata\JSSIP-PROJECTS\jssip-phone\src` — `Common`, `JSSIP_CONFIGS`, `SettingModal` field inventory

### Skills
- `.cursor/skills/feature-slice-design/SKILL.md`
- `.cursor/skills/legacy-feature-migration/SKILL.md`
- `.cursor/skills/softphone-architecture-review/SKILL.md` (перед изменением port/repository)

### Rules
- architecture, feature-registry, legacy-feature-coverage, implementation-roadmap (P11)
- typescript-react-electron, testing-observability

---

## Контекст

| Item | Value |
|------|-------|
| Phase | **P11 WU4** |
| Feature | **F-016** (shell/settings UX foundation) |
| Baseline | **676 passed**, 1 skipped (commit `10080c3`) |
| Done WU3 | collapsed shell, `deriveHeaderChromeShell`, avatar + registration dot |
| Existing | `SettingsRepository`, `InMemorySettingsRepository`, `updateMultiCallSettings` facade |

---

## Legacy IDs (эта WU)

- **LF-077** — per-user config persistence behind repository (schema + migration + adapter boundary)
- **LF-076** — schema fields for auto-answer, RBT, multisession (wire-ready; UI panels deferred)
- **LF-016** / **LF-033** — auto-answer timeout + RBT flags in schema (validation only; behavior already in policies)

---

## Out of scope (STOP)

- Full settings UX panels (account, audio, notifications, theme, codecs tab LF-084)
- Full user menu / logout redesign (LF-086)
- Radix Dialog migration (UI-6)
- CSS Modules / tokens mass migration (UI-4)
- Electron IPC settings window
- OCP plugin settings beyond existing ports
- Collapsed shell / CallLineRow changes (WU3 closed)
- Use Cases for pure config flags (unless business rule appears — then ADR)

---

## Deliverables

| # | Area | Path |
|---|------|--------|
| 1 | **Design doc** | `docs/softphone/P11-Settings-Schema-Design.md` — version, fields, migration steps, validation rules |
| 2 | **Domain types** | `src/domain/settings/` — `UserSettings` / `SettingsSchemaVersion`, branded account key |
| 3 | **Validation** | `src/domain/settings/validateUserSettings.ts` + unit tests |
| 4 | **Migration** | `src/application/settings/migrateUserSettings.ts` (v0 in-memory → v1) + tests |
| 5 | **Port** | extend `SettingsRepository` — `getUserSettings` / `saveUserSettings` (or equivalent aggregate) |
| 6 | **Adapter** | `InMemorySettingsRepository` + **new** `FileSettingsRepository` or `ElectronSettingsRepository` stub with in-memory fallback for tests |
| 7 | **Facade** | `AccountBootstrapFacade` read/write user settings + store projection refresh helper |
| 8 | **Regression** | existing `multiSessionsEnabled` path still works via schema (no repo hack) |
| 9 | **Tests** | unit migration/validation; integration facade → repository; adapter round-trip |
| 10 | **Docs** | Feature Registry F-016, Legacy LF-077 evidence, handoff, work-history |

---

## Architecture boundaries

- Schema + validation in **Domain**; migration in **Application**
- UI still: `useSettingsActions` → facade → port (no `@ports` in components)
- Persisted JSON validated at adapter boundary (`unknown` → narrow)
- Per-user key = SIP `authorization_user` / `agentId` (document choice in design doc)
- OCP-only fields optional in schema; SIP-only boot must not require OCP keys

---

## Anti-patterns

- Raw `localStorage` / `fs` in React or Domain
- `any`, `@deprecated` APIs
- Breaking WU1 `setMultiCallSettings` without migration path
- Settings panels in this WU
- Use Case for `multiSessionsEnabled`-class flags without ADR

---

## Verification

```bash
npm run test && npm run lint && npm run typecheck
```

Ожидаемый test count: **676 + N** (ориентир +8…+20), 1 skipped.

Manual smoke:
1. Toggle multi-session still persists through new schema path.
2. Fresh install gets default v1 settings.
3. Corrupt/unknown version fails gracefully with observable error (no silent defaults for security-sensitive fields).

---

## Gate WU4

- [x] `P11-Settings-Schema-Design.md` created
- [x] Versioned schema + validation tests
- [x] Migration v0→v1 tested
- [x] Repository aggregate read/write
- [x] Facade + projection refresh
- [x] WU1 multi-session regression green
- [x] LF-077 evidence in Legacy-Feature-Coverage
- [x] Feature Registry F-016 updated

**STOP after WU4 gate.** See `handoffs/P11-WU4-Settings-Schema-Handoff.md`.
