# Manual update manifest contract (F-020)

## Purpose

Remote JSON consumed by in-app "Check for updates". No auto-install; opens download page only.

## Fields

- `latestVersion` (required): semver string, e.g. `1.2.0`
- `downloadUrl` (required): HTTPS release or downloads page
- `releaseDate` (optional): ISO or human-readable date string
- `releaseNotesUrl` (optional): HTTPS URL for release notes
- `platforms` (optional): `{ "win32" | "darwin" | "linux": HTTPS URL }`
- `minimumSupportedVersion` (optional): semver for future policy use

## Example

See `docs/softphone/examples/update-manifest.json` (Axatalk / `HailRase/softphone-electron`).

Live manifest path (commit to `main`):

```txt
docs/softphone/release/update-manifest.json
```

Raw URL (baked via `VITE_UPDATE_MANIFEST_URL`):

```txt
https://raw.githubusercontent.com/HailRase/softphone-electron/main/docs/softphone/release/update-manifest.json
```

Operational guide: `docs/softphone/GitHub-Releases-Update-Guide.md`.

## App configuration

Set `VITE_UPDATE_MANIFEST_URL` to the HTTPS manifest URL at build time (e.g. `.env.production`).

## Publishing a release

1. Bump `version` in `package.json`
2. Run `npm run build:win|mac|linux` and upload installers
3. Update hosted manifest JSON (`latestVersion`, `downloadUrl`, optional `platforms`)
4. Rebuild or redeploy app only if manifest URL changed; otherwise existing installs pick up the new manifest on next manual check
5. Verify: Settings → General → «Проверить обновления»
