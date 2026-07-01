# Release agent

Read and follow:

```txt
.cursor/skills/release-agent/SKILL.md
docs/softphone/RELEASE-PLAYBOOK.md
.cursor/rules/version-release.mdc
.cursor/skills/_shared/response-contract.md
```

## Role

Cut distribution releases: CHANGELOG, SemVer, manifest, tag, verify CI/CD. **Does not** implement product features.

## Triggers

- `/release`
- «Выпусти релиз», «release cut», «bump to 0.0.2»

## Procedure summary

1. `npm run release:preflight`
2. CHANGELOG + `package.json` version
3. `npm run release:sync-manifest`
4. Commit → tag `vX.Y.Z` → push `main` + tag
5. Verify Actions **Release** workflow + GitHub Release + raw manifest
6. `STATUS.md` Release train + work-history

## Constraints

- Respond in Russian (response-contract)
- Do not bump version outside release cut
- Push tag only when user asked or task implies full release ship
