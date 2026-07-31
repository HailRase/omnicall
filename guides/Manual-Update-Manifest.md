# Manual update manifest contract (F-020)

## Purpose

Remote JSON consumed by in-app update checks (startup background + manual Settings). No auto-install; opens download page only.

## Fields

- `latestVersion` (required): semver string, e.g. `1.2.0`
- `downloadUrl` (required): HTTPS release or downloads page (e.g. `/releases/latest`). Settings «Открыть страницу загрузки» and startup banner «Скачать» open this URL.
- `releaseDate` (optional): ISO or human-readable date string
- `releaseNotesUrl` (optional): HTTPS URL for release notes
- `platforms` (optional): `{ "win32" | "darwin" | "linux": HTTPS URL }` — direct installer URLs for documentation or future use; not used for in-app «open download page»
- `minimumSupportedVersion` (optional): semver for future policy use

## Example

See `docs/softphone/examples/update-manifest.json` (template). Published copy: `HailRase/omnicall-releases` → `update-manifest.json`.

Live manifest (public distribution repo):

```txt
https://raw.githubusercontent.com/HailRase/omnicall-releases/main/update-manifest.json
```

Operational guide: [`GitHub-Releases-Update-Guide.md`](GitHub-Releases-Update-Guide.md).

## App configuration

Set `VITE_UPDATE_MANIFEST_URL` to the HTTPS manifest URL at build time (e.g. `.env.production`).

## Publishing a release

1. Bump `version` in `package.json`
2. Run `npm run build:win|mac|linux` and upload installers
3. Update hosted manifest JSON (`latestVersion`, `downloadUrl`, optional `platforms`)
4. Rebuild or redeploy app only if manifest URL changed; otherwise existing installs pick up the new manifest on next startup background check or manual Settings check
5. Verify: launch app (startup banner when update available) and Settings → General → «Проверить обновления»
