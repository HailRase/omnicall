# Changesets

Release scaffolding for `@softomnitel/omnicall-protocol` and `@softomnitel/omnicall-kit`.

## SDK-10 Mode A (RC staging)

- Pending changeset: `first-public-rc.md` (minor for both packages).
- Workspace is in **prerelease mode** (`pre.json`, tag **`rc`**) so
  `changeset version` yields **`0.1.0-rc.0`**, not `0.1.0`.
- Packages stay `private: true` until a human authorizes registry publish.
- `changeset version` / real `npm publish` are **not** run without explicit
  in-session authorization and DI-10 / waiver gates.

## Commands (authorized RC publish only)

```bash
cd omnicall-kit
# Confirm: .changeset/pre.json exists with mode=pre, tag=rc
# (re-enter only if missing: npx changeset pre enter rc)

# 1. Confirm DI-10 / waiver gate for the intended tag
# 2. Flip private:false only for @softomnitel/omnicall-protocol and @softomnitel/omnicall-kit
npx changeset version          # → 0.1.0-rc.0 + CHANGELOG
npm run preflight
npm run release:check
npm publish -w @softomnitel/omnicall-protocol --tag rc --access public --provenance
npm publish -w @softomnitel/omnicall-kit --tag rc --access public --provenance
```

## Stable promote (Mode B only — after DI-10)

```bash
npx changeset pre exit
# add a changeset if needed, then:
npx changeset version          # strips -rc → stable 0.1.0 (or next)
npm run preflight
npm run release:check
npm publish -w @softomnitel/omnicall-protocol --tag latest --access public --provenance
npm publish -w @softomnitel/omnicall-kit --tag latest --access public --provenance
```

Never publish `latest` while DI-10 is open.  
See `docs/guide/release-and-support.md`.
