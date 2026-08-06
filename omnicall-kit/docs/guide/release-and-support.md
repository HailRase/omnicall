# Release, Rollback, Revoke & Support

Canonical release procedure for `@softomnitel/omnicall-protocol` and `@softomnitel/omnicall-kit`.
This page documents **RC staging readiness** and fail-closed stable promotion.

**Current (verified npm + workspace):** kit **`0.2.0`** / protocol **`0.1.0`** on
dist-tag **`latest`**. **RC:** `0.1.0-rc.0` on **`rc`**.
**Prior kit patches:** `0.1.3` … `0.1.0` (Mode B after DI-10).

## Versioning strategy

| Item | Policy |
| --- | --- |
| First RC | `0.1.0-rc.0` (tag `rc`) — published 2026-07-27 |
| First stable | **`0.1.0`** (tag `latest`) — Mode B after DI-10 full close |
| Current kit `latest` | **`0.2.0`** (workspace matches) |
| Current protocol `latest` | **`0.1.0`** |
| ADR-0027 corrective | Kit **MINOR** if additive public DX; else **PATCH**. Desktop **PATCH** for behavior fixes. No bump until authorized release cut (WU-07). |
| npm access | **`public`** on Free org (future Teams → `restricted` optional) |
| License | **`UNLICENSED`** — not OSS; publish requires `RELEASE_LICENSE_REVIEWED=1` |
| Tooling | `@changesets/cli` — see `.changeset/` |
| Playbook | `guides/RELEASE-PLAYBOOK.md` |

Linked packages: bump `@softomnitel/omnicall-protocol` and `@softomnitel/omnicall-kit` together when wire changes; kit-only patches may leave protocol at `0.1.0`.

### Mode B stable (completed 2026-07-27)

```bash
npx changeset pre exit
npm run release:version          # → 0.1.0
npm run release:prepare
npm run release:preflight
npm run release:check
RELEASE_CONFIRM=1 RELEASE_DI10_DONE=1 npm run release:publish-stable
```

Published: `@softomnitel/omnicall-protocol@0.1.0` + `@softomnitel/omnicall-kit@0.1.0` (`latest`).

### Historical RC workflow (Mode A — already done)

```bash
# Was used for 0.1.0-rc.0 on tag rc
npm run release:version
npm run release:prepare
RELEASE_CONFIRM=1 npm run release:publish-rc
```

## Provenance & package fortress

| Check | Required |
| --- | --- |
| `publishConfig.access` | `public` (Free org) or `restricted` (Teams) |
| `publishConfig.provenance` | `true` on CI; may be `false` for local CLI |
| `@softomnitel/omnicall-kit` `files` | `dist`, `LICENSE`, `README.md` only |
| Forbidden in tarball | `fake-transport`, `auth-test-peer`, `src/docs` harness, tests |
| Example app | `examples/crm-pairing-lite` stays `private: true` (not an npm release) |

Verify with `npm run package:check` and `npm run release:check`.

## SBOM

```bash
npm run sbom
```

Writes CycloneDX documents under `temp/sbom/` for each publishable package.
Attach the SBOM paths in release evidence. Do not put secrets, phones, or tokens in
SBOM notes or release prose.

## Rollback procedure

| Situation | Action |
| --- | --- |
| Bad RC on tag `rc` | Publish a fixed `0.1.0-rc.N+1` on `rc`; document the bad build in CHANGELOG |
| Accidental `latest` | Immediately `npm dist-tag add @softomnitel/omnicall-kit@<last-good> latest` (and protocol); open incident |
| Consumer on bad RC | Pin prior RC or workspace commit; do not “hot-patch” desktop secrets into the page |
| Protocol wire break | Desktop returns `incompatible_version`; clients must stop — see upgrade guide |

Deprecate a bad version with `npm deprecate` when the registry copy must warn installs.

## Revoke procedure (paired clients)

Package rollback is **not** the same as client revocation.

| Event | Operator / desktop | SDK client |
| --- | --- | --- |
| Admin revoke paired client | Desktop Settings / gateway revoke | Client enters `revoked`; clear session UI; re-pair |
| Capability strip | Desktop grant UX | `permission-changed` / subsequent `forbidden` |
| Compromised PoP material | Revoke client; rotate pairing | New pair; never restore keys from Web Storage |

Clients must never persist pairing secrets, tokens, or PoP private material in
`localStorage` / `sessionStorage` (see [security anti-patterns](./security-anti-patterns.md)).

## Support policy (RC / incubation)

| Channel | Guidance |
| --- | --- |
| Integrators | Follow `docs/guide/`; public surface = `etc/api/sdk.api.md` (count in report / api-reference inventory) |
| Protocol | `etc/api/protocol.api.md` (allowlisted; report wins) |
| Desktop gate | F-011 corrective WU-07 **PASS**; human SemVer/license/publish remain open |
| Browser baseline | Chromium / Edge (Chromium); smoke scripts are not gate blockers |
| Security issues | Fail closed; do not weaken `sanitizeRequestedCapabilities` for DX |

## Stable promotion gate (Mode B — completed 2026-07-27)

All of the following were required before first `latest` (`0.1.0`):

1. DI-10 / F-011 unit + integration + desktop/kit preflight green.
2. SDK↔desktop compatibility / hostile matrix cells covered by unit/integration tests.
3. Architecture + security reviews Blocker-free for the publish surface.
4. RC on non-default tag validated for the agreed window.
5. Changelog + SBOM + provenance verified for the exact tarballs being promoted.

Do not require packaged Electron / Chromium / Edge smoke for Mode B or corrective closes.

**Further publishes** while `"license": "UNLICENSED"` also require
`RELEASE_LICENSE_REVIEWED=1` (human legal review; do not invent SPDX). Corrective
track SemVer bumps wait for an authorized release cut (WU-07+).
