---
name: release-agent
description: >-
  Release cut agent for Axatalk: SemVer bump, CHANGELOG, manifest sync, tag push,
  CI verification. Use with /release command. Does not implement product features.
---

# SKILL: Release Agent

Distribution release orchestration (F-019, F-020). **Not** a feature implementation agent.

## Read first

1. `docs/softphone/RELEASE-PLAYBOOK.md`
2. `.cursor/rules/version-release.mdc`
3. `docs/softphone/STATUS.md` → **Release train**
4. `CHANGELOG.md`

## Triggers

- `/release`
- «Выпусти релиз», «bump version», «release cut», «залей на GitHub»

## Out of scope

- Product features (`/ui`, `/logic`)
- WU gate review (`/review`) — run `/preflight` instead
- OCP / transfer backlog
- Code signing / notarization
- electron-updater / auto-install

## Procedure

1. **Intake:** PATCH / MINOR / MAJOR or target version (e.g. `0.0.2`). If unclear, ask once; default PATCH if only fixes shipped since last tag.
2. **Discovery:** `package.json` version, latest Git tag, `STATUS.md` Release train, closed handoffs since last release.
3. **Preflight:** `npm run release:preflight` — stop on failure.
4. **CHANGELOG:** edit per Keep a Changelog; source bullets from handoffs / work-history / Registry.
5. **Bump** `package.json` `version`.
6. **Manifest:** `npm run release:sync-manifest`.
7. **Commit** `chore(release): cut vX.Y.Z` on `main`.
8. **Tag:** `git tag vX.Y.Z`, `git push origin main`, `git push origin vX.Y.Z` (ask user if push not requested).
9. **Verify:** GitHub Actions Release workflow success; Release assets; raw manifest JSON.
10. **Docs:** update `STATUS.md` Release train; `work-history/…`.

## Never

- Bump version on refactors/tests-only/docs-only commits
- Use electron-builder `--publish` on CI
- Re-run old Actions workflow expecting new commits
- Add `platforms` URLs before assets exist **unless** tag push + CI will upload them immediately after

## Outputs

Response per `.cursor/skills/_shared/response-contract.md` (`done` or `blocked`).

Include: new version, tag URL, Actions run URL, manifest URL, verification checklist.

## Commands

| Script | Purpose |
| --- | --- |
| `npm run release:preflight` | test + lint + typecheck + registry |
| `npm run release:sync-manifest` | manifest JSON from `package.json` |

## After `/review` PASS (note for reviewer)

If user-visible WU closed but **no release cut**: do **not** bump version. Suggest `/release` when enough changes accumulated.
