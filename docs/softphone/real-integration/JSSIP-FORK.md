# JsSIP dependency: `@hailrase/jssip`

## What

Real SIP adapters use **`@hailrase/jssip`** (npm), not the upstream `jssip` package.

`@hailrase/jssip` is a **fork of [versatica/JsSIP](https://github.com/versatica/JsSIP)** with a **small targeted fix** required for our dev SBC / production behavior. API surface and adapter boundaries are unchanged: JsSIP stays behind `TelephonyGateway` only.

## Where in code

| Item | Location |
| --- | --- |
| Dependency | `package.json` → `@hailrase/jssip` |
| UA factory | `src/adapters/telephony/jssip/createJsSipUserAgent.ts` |
| Session types | `src/adapters/telephony/jssip/wrapJsSipRtcSession.ts` |
| Vite pre-bundle | `electron.vite.config.ts` → `renderer.optimizeDeps.include` |

## Rules

- Import `@hailrase/jssip` only inside `src/adapters/telephony/jssip/` (and tests co-located there).
- Do not add a direct `jssip` dependency or swap back to upstream without an ADR.
- After dependency changes, clear `node_modules/.vite` before `npm run dev` if Vite reports `Outdated Optimize Dep` or ENOENT under `node_modules/jssip/`.

## Version

Pinned in `package.json` (currently `^3.10.2` — latest published on `@hailrase` scope). Upstream `jssip@3.13.x` is a different release line; upgrade the fork explicitly, not by aliasing to npm `jssip`.
