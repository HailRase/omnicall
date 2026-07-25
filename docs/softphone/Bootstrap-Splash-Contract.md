# Bootstrap Splash Contract (F-016 / LF-002)

**Single-stage loading UI.** The user sees one `#boot-splash` from first paint until bootstrap settle/hide. React must **not** mount a second loading splash.

## Stages (technical)

| Phase | Surface | Who owns visuals |
| --- | --- | --- |
| Pre-React + React `loading` + settle | `index.html` → `#boot-splash` | HTML CSS + React via `bootSplashDom` |
| React `error` | `BootstrapSplashShell` (`variant="error"`) | React (HTML splash dismissed first) |
| React `ready` (after settle) | `SoftphoneReadyShell` | React (`#boot-splash` removed) |

## Single-stage rules (mandatory)

1. `#boot-splash` is the **only** loading splash (z-index above `#root`).
2. `#root` stays visually empty/transparent under the splash while loading — do not mount `BootstrapSplashShell` for `loading`.
3. `useBootSplashController` drives:
   - `setBootSplashMessage` ← i18n `bootstrap.loading`
   - `updateBootSplashProgress` ← visual 0–100 (`useBootstrapSplashProgress`)
   - `data-settled` at 100%, then `dismissBootSplash` after settle (~700ms)
4. On ready after settle: mount `SoftphoneReadyShell` **under** `#boot-splash`, set `data-exiting` for a CSS opacity crossfade (`BOOT_SPLASH_EXIT_MS` ≈ 420ms), then `dismissBootSplash`. Never hard-remove the splash in the same frame as the ready shell (avoids a visual glitch).
5. On `error`: dismiss `#boot-splash` immediately, then show `BootstrapSplashShell` error.
6. Do not reintroduce HTML↔React loading handoff / phase-sync for production loading.
7. Respect `prefers-reduced-motion` (skip exit transition).

## Brand color

| Stop | Hex | Sources |
| --- | --- | --- |
| from | `#6BC4FF` | `startupSplashColors`, `--color-brand-splash-*`, `#boot-splash` |
| mid | `#42AAFF` | **product mark** — keep identical everywhere |
| to | `#2A8FD9` | same |

OS app icon plate (`build-app-icons.py`) may differ; splash mid is `#42AAFF`.

## Mark + copy

| Element | Source |
| --- | --- |
| Mark | Lucide **Phone** SVG in `#boot-splash` (not `PhoneOutgoing`) |
| Atmosphere | `.boot-atmosphere` cyan radial |
| Ground shadow | `.boot-shadow` — **ellipse** (`border-radius: 50%`), placed below the ball; soft via light `blur` + `box-shadow` (not a flat pill / not invisible under the ball) |
| Loading text | Pre-React: `navigator.language` map; after React: `bootstrap.loading` via `setBootSplashMessage` |
| Progress | Indeterminate until React; then determinate (`data-progress-mode="determinate"`) |

## Motion

- Bounce **1200ms** on `#boot-splash` only (`BOOTSTRAP_SPLASH_BOUNCE_MS`).
- Animate `transform` / `opacity` only (plus shadow scale/opacity).
- Sequence on ready: settle ball (`data-settled`, ~700ms) → mount ready shell under splash → exit crossfade (`data-exiting` / `beginBootSplashExit`, ~420ms) → `dismissBootSplash`.
- Opaque `#boot-splash` background (synced with `STARTUP_SPLASH_BG_*`) so the crossfade does not flash through mixed layers.
- Respect `prefers-reduced-motion` (skip bounce/exit transitions).

## Boundaries

- No SIP / Electron IPC / repositories / Use Cases in splash UI or `bootSplashDom`.
- Bootstrap gate still awaits `initialize` (`useAccountBootstrap`).
- `BootstrapSplashShell` `variant="loading"` remains for Storybook/tests only — not used on the production loading path.

## Evidence / tests

- `bootSplashDom.test.ts`
- `useBootSplashController.test.ts`
- `useBootstrapSplashProgress.test.ts`
- `BootstrapSplashShell.test.tsx` (error + Storybook loading)
- Storybook: `Shells/BootstrapSplashShell`
