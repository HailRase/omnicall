# OmniCall Distribution Release Notes Contract

Public release notes for [HailRase/omnicall-releases](https://github.com/HailRase/omnicall-releases) are generated from `distribution/CHANGELOG.md` in the publishing pipeline.

## Source of truth

| File | Role |
| --- | --- |
| `distribution/CHANGELOG.md` | Public English changelog (Keep a Changelog) |
| `CHANGELOG.md` (private repo) | Internal changelog during development |
| `distribution/update-manifest.json` | `releaseNotesUrl` points to the GitHub Release page |

During a release cut, update **both** changelogs. Public bullets must be user-facing English with no internal ticket IDs, agent notes, or private URLs.

## GitHub Release body format

```markdown
## OmniCall vX.Y.Z

**Release date:** YYYY-MM-DD

### Highlights
- One-line summary of the most important change (optional; omitted if none)

### Added
- User-visible additions

### Changed
- Behaviour or UX changes

### Fixed
- Bug fixes

### Known Notes
- Caveats or migration notes (only when relevant)

### Distribution artifacts
- Windows: `OmniCall-X.Y.Z-win-x64.exe`, `OmniCall-X.Y.Z-win-x64.msi`
- macOS: `OmniCall-X.Y.Z-mac-arm64.dmg`
- Linux: `OmniCall-X.Y.Z-linux-x86_64.AppImage`, `OmniCall-X.Y.Z-linux-amd64.deb`

### Updates
In-app update checks read [`update-manifest.json`](https://github.com/HailRase/omnicall-releases/blob/main/update-manifest.json) on `main`.
```

Sections with no items are omitted. If no changelog entry exists for a version, the fallback body is:

> Release notes were not recorded for this version. Future releases will include detailed changes.

## Automation (publishing repository)

Releases are created and updated by CI in the private publishing repository when tag `vX.Y.Z` is pushed.

| Step | Script | When |
| --- | --- | --- |
| Create release + upload installers | `scripts/publish-distribution-release.mjs` | Each platform build job |
| Set final release body | `scripts/update-distribution-release-notes.mjs` | `finalize-distribution` job |
| Backfill historical bodies | `scripts/backfill-distribution-release-notes.mjs` | Manual, one-time or on demand |

Required environment variables: `DISTRIBUTION_GITHUB_TOKEN` (or `OMNICALL_RELEASES_TOKEN`), `RELEASE_TAG` (e.g. `v0.1.3`).

## Manual backfill

```bash
# Preview without API calls
node scripts/backfill-distribution-release-notes.mjs --dry-run

# Update all releases that have a CHANGELOG entry
DISTRIBUTION_GITHUB_TOKEN=<pat> node scripts/backfill-distribution-release-notes.mjs

# Single version
DISTRIBUTION_GITHUB_TOKEN=<pat> node scripts/backfill-distribution-release-notes.mjs v0.1.0
```

Token needs **Contents: read and write** on `HailRase/omnicall-releases`.

## Publishing checklist

1. Add `## [X.Y.Z] - YYYY-MM-DD` to `distribution/CHANGELOG.md` (English, user-facing).
2. Bump `package.json`, sync manifest, commit, tag `vX.Y.Z`, push.
3. CI uploads installers and writes the release body from the changelog.
4. Verify [Releases](https://github.com/HailRase/omnicall-releases/releases) and raw [manifest](https://raw.githubusercontent.com/HailRase/omnicall-releases/main/update-manifest.json).
