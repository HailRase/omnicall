# Release, Rollback, Revoke & Support

Canonical release procedure for `@softomnitel/omnicall-protocol` and `@softomnitel/omnicall-kit`.
This page documents **RC staging readiness** and fail-closed stable promotion.

**Mode B (current):** stable **`0.1.2`** on npm dist-tag **`latest`** (README без ссылок на приватный GitHub, 2026-07-28).  
**Prior:** `0.1.1` (docs refresh), `0.1.0` (Mode B after DI-10).  
**RC:** `0.1.0-rc.0` remains on dist-tag **`rc`**.

## Versioning strategy

| Item | Policy |
| --- | --- |
| First RC | `0.1.0-rc.0` (tag `rc`) — published 2026-07-27 |
| First stable | **`0.1.0`** (tag `latest`) — Mode B after DI-10 full close |
| npm access | **`public`** on Free org (future Teams → `restricted` optional) |
| Tooling | `@changesets/cli` — see `.changeset/` |
| Playbook | `guides/RELEASE-PLAYBOOK.md` |

Linked packages: bump `@softomnitel/omnicall-protocol` and `@softomnitel/omnicall-kit` together.

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
| Desktop gate | F-011 remains **in progress** until DI-10 / P12 close |
| Browser baseline | Chromium / Edge (Chromium) only until DI-10 matrix expands |
| Security issues | Fail closed; do not weaken `sanitizeRequestedCapabilities` for DX |

## Stable promotion gate (Mode B — not claimed here)

All of the following must be true before `latest`:

1. DI-10 `done` with packaged Electron E2E evidence attached.
2. SDK↔desktop compatibility / hostile matrix cells recorded PASS (or waived by name).
3. Architecture + security reviews Blocker-free for the publish surface.
4. RC on non-default tag validated for the agreed window.
5. Changelog + SBOM + provenance verified for the exact tarballs being promoted.

Until then: **RC-ready / stable-blocked**.
