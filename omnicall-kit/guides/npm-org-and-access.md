# npm Organization `@softomnitel` — Access Guide

## Current state

| Item | Status |
| --- | --- |
| npm org `softomnitel` | Created |
| Plan | **Free** now (public packages OK) → later **Teams** for private |
| Packages | `@softomnitel/omnicall-protocol`, `@softomnitel/omnicall-kit` |
| Interim publish posture | **`public`** while on Free (do not publish `restricted` yet) |
| Later private | Switch `publishConfig.access` → `restricted` after Teams upgrade |
| Registry | kit `latest`=`0.2.0`, protocol `latest`=`0.1.0`; RC `0.1.0-rc.0` |

## Free plan (now)

You can:

- Keep the org and scope name
- Develop, version, pack, SBOM, `release:check`
- Invite members / create teams
- **Publish public** scoped packages (`--access public`)

You cannot:

- `npm publish --access restricted` (needs Teams)
- Limit installs to invited users via npm private packages

**Interim recommendation:** publish first RC as **public** under tag `rc` to claim the package names on the org, then move to private after Teams if needed (already-published public versions stay public).

## After Teams upgrade

1. npmjs.com → org `softomnitel` → Billing → upgrade to Teams (~$7/user/month).
2. Require 2FA for the organization.
3. Teams: `owners` (read-write), `integrators` (read-only).
4. Optionally set `publishConfig.access` to `restricted` for **new** versions.
5. Create granular npm token for CI publish; store as `NPM_TOKEN` secret (never in git).
6. Run release cut per [RELEASE-PLAYBOOK.md](./RELEASE-PLAYBOOK.md).
7. Grant install access (private packages only):

```bash
npm access grant read-only softomnitel:integrators @softomnitel/omnicall-protocol
npm access grant read-only softomnitel:integrators @softomnitel/omnicall-kit
```

## Integrator install

**Public RC (Free / interim):**

```bash
npm install @softomnitel/omnicall-kit@rc
```

**Private (after Teams):** `.npmrc` (token via env, not committed):

```ini
@softomnitel:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

```bash
npm login   # account must be in softomnitel:integrators
npm install @softomnitel/omnicall-kit@rc
```

## Security layers (do not confuse)

| Layer | Protects |
| --- | --- |
| npm private + teams | Who can download the package |
| Desktop Origin / pairing / capabilities | Who can control the softphone at runtime |

Private npm does **not** replace pairing security. See `docs/SECURITY.md`.

## Note on public → private

Versions already published as `public` remain publicly downloadable forever.
New versions can be `restricted` after Teams; plan names/tags accordingly.
