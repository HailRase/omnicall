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
| Windows installer | `Axatalk-0.0.2-win-x64.exe` |
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

Updates `docs/softphone/release/update-manifest.json` and `examples/update-manifest.json` from `package.json` (platform URLs, `latestVersion`, `releaseDate`).

### 6. Commit on `main`

```txt
chore(release): cut vX.Y.Z
```

Include: `package.json`, `CHANGELOG.md`, both manifest JSON files.

### 7. Tag and push

```bash
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

**Order matters:** manifest on `main` **before** tag so raw URL matches new version when CI finishes.

### 8. CI / CD (automatic on tag)

| Workflow | Trigger | Result |
| --- | --- | --- |
| `ci.yml` | push to `main` | test, lint, typecheck, registry |
| `release.yml` | push tag `v*.*.*` | build win/mac/linux → **GitHub Release assets** |

Monitor: [Actions → Release](https://github.com/HailRase/softphone-electron/actions/workflows/release.yml)

**Do not** use **Re-run** on an old workflow for a new fix — use **Run workflow** or push a new tag.

### 9. Verify (agent or human)

1. GitHub Release `vX.Y.Z` has `.exe`, `.dmg`, `.AppImage` (and optional `.deb`)
2. Direct download URLs return 200 (not 404)
3. Raw manifest: `curl` `VITE_UPDATE_MANIFEST_URL` — `latestVersion` and `platforms` match
4. Optional: in-app **Настройки → О программе → Проверить обновления**

### 10. Post-release docs

- `STATUS.md` → **Release train** section
- `work-history/YYYY-MM-DD/release-vX.Y.Z_….md`

**Rebuild installed clients** only if `VITE_UPDATE_MANIFEST_URL` changed (rare).

## Manual build (no new version)

For testing installers without a release cut:

1. Actions → **Release** workflow → **Run workflow** → branch `main`
2. Download **Artifacts** only (no GitHub Release publish)

## workflow_dispatch vs tag

| Mode | Builds | Publishes to GitHub Release |
| --- | --- | --- |
| `workflow_dispatch` | Yes | **No** |
| Push tag `v*.*.*` | Yes | **Yes** (`softprops/action-gh-release`) |

## electron-builder on CI

- Packaging uses `scripts/run-electron-builder.mjs` (`--publish never`, tokens cleared)
- **Never** enable electron-builder auto-publish (F-020 uses manual manifest)

## Related docs

- `Developer-Release-CI-Guide.md` — developer guide (RU): versions, CI, Linux installers
- `GitHub-Releases-Update-Guide.md`
- `Manual-Update-Manifest.md`
- `.cursor/rules/version-release.mdc`
