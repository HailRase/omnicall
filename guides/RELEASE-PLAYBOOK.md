# Release Playbook (Axatalk)

Operational guide for **distribution releases** (F-019, F-020). Agents: use with `/release` and `.cursor/rules/version-release.mdc`.

## Who does what

| Role | Bump version | Tag / CI | Manifest | CHANGELOG |
| --- | --- | --- | --- | --- |
| `/ui`, `/logic`, `/adapter` | **Never** | **Never** | **Never** | **Never** |
| `/release` agent | **Yes** (release cut) | **Yes** | **Yes** | **Yes** |
| Human | Approve tag push if needed | Watch Actions | Verify raw URL | Review notes |

## When to bump version

| Change | SemVer (pre-1.0) | Example |
| --- | --- | --- |
| Bug fix, no new UX | PATCH | `0.0.1` → `0.0.2` |
| New user-visible feature (Registry `implemented`) | MINOR | `0.0.2` → `0.1.0` |
| Breaking host API, settings schema v2 | MAJOR | `0.x` → `1.0.0` |

**Do not bump** for: refactors, tests-only, docs-only, reviewer-only, intermediate WU commits.

## Naming conventions

| Item | Format |
| --- | --- |
| `package.json` version | `0.0.2` (no `v`) |
| Git tag | `v0.0.2` |
| Release title | `Axatalk v0.0.2` or `Axatalk 0.0.2` |
| Windows installer | `Axatalk-0.0.2-win-x64.exe` (NSIS) · `Axatalk-0.0.2-win-x64.msi` (IT) |
| macOS | `Axatalk-0.0.2-mac-arm64.dmg` |
| Linux AppImage (CI) | `Axatalk-0.0.2-linux-x86_64.AppImage` |

## Release cut procedure (`/release`)

### 1. Preflight

```bash
npm run release:preflight
```

Must be green before any version bump.

### 2. Decide version

From user request or SemVer table above. Confirm no duplicate tag on GitHub.

### 3. CHANGELOG

1. Move items from `[Unreleased]` to new `## [X.Y.Z] - YYYY-MM-DD`
2. Clear `[Unreleased]` sections (keep headings)
3. Update compare links at bottom

### 4. Bump `package.json` version

Only the `version` field.

### 5. Sync manifest

```bash
npm run release:sync-manifest
```

Updates dev manifest copies + `distribution/update-manifest.json` (payload for **axatalk-releases**). URLs point to public distribution repo.

### 6. Commit on `main`

```txt
chore(release): cut vX.Y.Z
```

Include: `package.json`, `CHANGELOG.md`, manifest JSON files, `distribution/update-manifest.json` if changed.

### 7. Tag and push

```bash
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

**Order matters:** commit on `main` **before** tag. CI pushes manifest to **axatalk-releases** `main` after publish.

**Prerequisite:** secret `AXATALK_RELEASES_TOKEN` in repo Actions (see `guides/Distribution-Migration-Checklist.md`).

### 8. CI / CD (automatic on tag)

| Workflow | Trigger | Result |
| --- | --- | --- |
| `ci.yml` | push to `main` | test, lint, typecheck, registry |
| `release.yml` | push tag `v*.*.*` | build in softphone-electron → publish to **axatalk-releases** |

Monitor: [Actions → Release](https://github.com/HailRase/softphone-electron/actions/workflows/release.yml)

User-facing release: https://github.com/HailRase/axatalk-releases/releases

**Do not** use **Re-run** on an old workflow for a new fix — use **Run workflow** or push a new tag.

### 9. Verify (agent or human)

1. **axatalk-releases** Release `vX.Y.Z` has `.exe`, `.msi`, `.dmg`, `.AppImage` (installers only)
2. Direct download URLs return 200 (not 404)
3. Raw manifest: `https://raw.githubusercontent.com/HailRase/axatalk-releases/main/update-manifest.json`
4. Optional: in-app **Настройки → О программе → Проверить обновления**

### 10. Post-release docs

- [`docs/softphone/STATUS.md`](../docs/softphone/STATUS.md) → **Release train** section
- `work-history/YYYY-MM-DD/release-vX.Y.Z_….md`

**Rebuild installed clients** only if `VITE_UPDATE_MANIFEST_URL` changed (rare).

## Manual build (no new version)

For testing installers without a release cut:

1. Actions → **Release** workflow → **Run workflow** → branch `main`
2. Убедиться, что build jobs зелёные (бинарники в Artifacts **не** сохраняются — quota-safe)

## workflow_dispatch vs tag

| Mode | Builds | Publishes to axatalk-releases |
| --- | --- | --- |
| `workflow_dispatch` | Yes | **No** |
| Push tag `v*.*.*` | Yes | **Yes** (direct API upload per OS + manifest sync) |

## electron-builder on CI

- Packaging uses `scripts/run-electron-builder.mjs` (`--publish never`, tokens cleared)
- **Never** enable electron-builder auto-publish (F-020 uses manual manifest)
- Release workflow **does not use GitHub Artifacts** — installers upload directly to axatalk-releases via API

## Related docs

- `Developer-Release-CI-Guide.md` — developer guide (RU): versions, CI, Linux installers
- `GitHub-Releases-Update-Guide.md`
- `Manual-Update-Manifest.md`
- `.cursor/rules/version-release.mdc`
