# OmniCall Kit

Publishable npm workspace for SoftOmniTel:

| Package | npm name |
| --- | --- |
| Protocol | `@softomnitel/omnicall-protocol` |
| Browser SDK | `@softomnitel/omnicall-kit` |

Scoped under npm org **`softomnitel`**. Packages are configured for **private** (`restricted`) publish. npm **Teams** is required before registry publish; until then use this private GitHub repo for source access.

- **Standalone GitHub repo:** [HailRase/omnicall-kit](https://github.com/HailRase/omnicall-kit) (private) — publishable source.
- **Desktop incubation copy:** softphone tree `omnicall-kit/` (coupled with integration track).
- Desktop counterpart docs (when inside softphone): [`../omnicall-kit-integration/README.md`](../omnicall-kit-integration/README.md).

## Goal

Strictly typed browser SDK that connects to OmniCall Desktop through a secure local protocol without exposing Electron, SIP, JsSIP, OCP wire objects, or internal Domain Events.

## Start here

### Integrators

1. [`docs/guide/README.md`](docs/guide/README.md)
2. [`examples/crm-pairing-lite/`](examples/crm-pairing-lite/)
3. API report: [`etc/api/sdk.api.md`](etc/api/sdk.api.md)
4. npm access: [`guides/npm-org-and-access.md`](guides/npm-org-and-access.md)

### Release

1. [`guides/RELEASE-PLAYBOOK.md`](guides/RELEASE-PLAYBOOK.md)
2. [`docs/guide/release-and-support.md`](docs/guide/release-and-support.md)

### Agents

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
3. [`docs/SECURITY.md`](docs/SECURITY.md)
4. [`docs/PROTOCOL.md`](docs/PROTOCOL.md)
5. [`docs/DEFINITION-OF-DONE.md`](docs/DEFINITION-OF-DONE.md)

## Current status

- SDK-00…SDK-10: done
- DI-10 desktop gate: **full close** 2026-07-27 (F-011 `implemented`; P12 closed)
- npm registry: Mode B cut **`0.1.0`** (local) — **npm `latest` publish pending OTP/automation token**; RC `0.1.0-rc.0` already on `rc`
- Production readiness: stable version cut; registry `latest` awaiting publish auth

## Local commands

```bash
npm ci
npm run release:preflight
npm run release:check
```

Node engines: `>=20.19.0`.

## Release scripts (OmniCall-style)

| Script | Purpose |
| --- | --- |
| `npm run release:preflight` | Full gate |
| `npm run release:version` | Apply changesets |
| `npm run release:prepare` | Flip packages to publishable |
| `npm run release:check` | Pack / SBOM / dry-run |
| `npm run release:publish-rc` | Private publish `--tag rc` |
| `npm run release:publish-stable` | Private publish `--tag latest` (DI-10 gate) |

## Non-negotiable release rule

No stable npm release until:

- desktop secure transport and pairing gates pass;
- protocol compatibility tests pass in both directions;
- a packaged Electron end-to-end test passes;
- the security review has no Blockers;
- raw SIP and OCP credentials are absent from the normal browser SDK flow.
