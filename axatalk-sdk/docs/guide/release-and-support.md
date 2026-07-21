# Release, Rollback, Revoke & Support

Canonical release procedure for `@axata/axatalk-protocol` and `@axata/axatalk-sdk`.
This page documents **RC staging readiness** and fail-closed stable promotion.

**Mode A (current):** RC artifacts and dry-run are allowed.  
**Stable / `latest` publish:** blocked until desktop **DI-10** is `done` with packaged
Electron E2E evidence (or an explicit human waiver naming deferred cells).

## Versioning strategy

| Item | Policy |
| --- | --- |
| First public RC | `0.1.0-rc.0` for both packages (linked bump) |
| npm dist-tag for RC | **`rc`** (never `latest`) |
| Stable promote | Only after RC validation window + DI-10 E2E PASS |
| Tooling | `@changesets/cli` — see `.changeset/` |
| Workspace today | Packages remain `private: true` / `0.0.0` until a human authorizes RC publish |

Linked packages: bump `@axata/axatalk-protocol` and `@axata/axatalk-sdk` together for the first RC so
consumer installs resolve a matching workspace pair.

### Changeset workflow (when human authorizes publish)

Workspace is already in **prerelease mode** (`.changeset/pre.json`, tag `rc`).
That is required so `changeset version` produces **`0.1.0-rc.0`**, not bare `0.1.0`.

```bash
cd axatalk-sdk
# Confirm pre mode (must exist before versioning RC):
#   .changeset/pre.json → mode=pre, tag=rc
# If missing: npx changeset pre enter rc

# 1. Confirm DI-10 / waiver gate for the intended tag
# 2. Flip private:false ONLY for @axata/axatalk-protocol and @axata/axatalk-sdk
#    (required: config privatePackages.version=false skips private pkgs)
npx changeset version       # applies pending changesets → 0.1.0-rc.0 + CHANGELOG
npm run preflight
npm run release:check       # pack, publishConfig, SBOM, dry-run
# RC only — always pass --tag rc (matches pre tag):
npm publish -w @axata/axatalk-protocol --tag rc --access public --provenance
npm publish -w @axata/axatalk-sdk --tag rc --access public --provenance
```

Never run `npm publish` without `--tag rc` for the first public cut.  
Never publish `latest` / omit tag until Mode B (DI-10 done) and RC validation complete.

### Stable promote (Mode B only)

```bash
npx changeset pre exit
npx changeset version       # exits prerelease; yields stable version
# then publish with --tag latest only after DI-10 E2E PASS
```

## Provenance & package fortress

| Check | Required |
| --- | --- |
| `publishConfig.access` | `public` |
| `publishConfig.provenance` | `true` |
| `@axata/axatalk-sdk` `files` | `dist`, `LICENSE`, `README.md` only |
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
| Accidental `latest` | Immediately `npm dist-tag add @axata/axatalk-sdk@<last-good> latest` (and protocol); open incident |
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
| Integrators | Follow `docs/guide/`; public surface = `etc/api/sdk.api.md` (**47** symbols) |
| Protocol | `etc/api/protocol.api.md` (**169** symbols) |
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
