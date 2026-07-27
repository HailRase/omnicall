# Changesets

Release scaffolding for `@softomnitel/omnicall-protocol` and `@softomnitel/omnicall-kit`.

## SDK-10 Mode A (RC staging)

- Pending changeset: `first-public-rc.md` (minor for both packages).
- Workspace is in **prerelease mode** (`pre.json`, tag **`rc`**) so
  `changeset version` yields **`0.1.0-rc.0`**, not `0.1.0`.
- Packages stay `private: true` until a human authorizes registry publish.
- `changeset version` / real `npm publish` are **not** run without explicit
  in-session authorization and DI-10 / waiver gates.
- Registry access is **`restricted`** (private npm). Requires npm org **Teams** plan.

## Commands (authorized RC publish only)

```bash
# Confirm: .changeset/pre.json exists with mode=pre, tag=rc
# npm org softomnitel on Teams plan; npm login with publish rights

npm run release:version
npm run release:prepare
npm run release:preflight
npm run release:check
RELEASE_CONFIRM=1 npm run release:publish-rc
```

PowerShell:

```powershell
npm run release:version
npm run release:prepare
npm run release:preflight
npm run release:check
$env:RELEASE_CONFIRM='1'; npm run release:publish-rc
```

## Stable promote (Mode B only — after DI-10)

```bash
npx changeset pre exit
npm run release:version
npm run release:prepare
npm run release:preflight
npm run release:check
RELEASE_CONFIRM=1 RELEASE_DI10_DONE=1 npm run release:publish-stable
```

Never publish `latest` while DI-10 is open.  
See `guides/RELEASE-PLAYBOOK.md` and `docs/guide/release-and-support.md`.
