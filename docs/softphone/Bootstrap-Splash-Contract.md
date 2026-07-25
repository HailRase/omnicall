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
| Ground shadow | `.boot-shadow` — **ellipse** (`border-radius: 50%` + radial-gradient soft edge), placed below the ball; **no** animated `filter: blur` (paint jank). Softness via radial fade only |
| Ball look | Flat brand gradient + soft outer/inset shadow (no sphere/3D shading, no `perspective` / `rotateX`) |
| Loading text | Pre-React: `navigator.language` map; after React: `bootstrap.loading` via `setBootSplashMessage` |
| Progress | Indeterminate until React; then determinate (`data-progress-mode="determinate"`) |

## Motion

- Bounce **1000ms** on `#boot-splash` only (`BOOTSTRAP_SPLASH_BOUNCE_MS` in `startupSplashColors.ts`).
- Timing: **`linear`** + **ballistic Y samples** `Y ≈ H·4·t·(1−t)` at equal time steps — fast leave from ground, decelerate to apex, accelerate into landing (real gravity feel). Do **not** space keyframes evenly in height.
- `0%` transform **must equal** `100%` (seamless loop, no ground dwell). Contact squash only near 0%/100%.
- Animate `transform` / `opacity` only on the bounce/shadow layers.
- **Settle (no teleport):** when progress hits 100%, `settleSplashBallMotion` freezes the **current** computed transform, then eases to the rest pose (`BOOT_SPLASH_SETTLE_MS` ≈ 420ms). Never replace the bounce with a settle `@keyframes` mid-flight — that teleports the ball from apex to ground.
- Sequence on ready: settle ball (`data-settled`, ~700ms hold including freeze→rest) → mount ready shell under splash → exit crossfade (`data-exiting` / `beginBootSplashExit`, ~420ms) → `dismissBootSplash`.
- Opaque `#boot-splash` background (synced with `STARTUP_SPLASH_BG_*`) so the crossfade does not flash through mixed layers.
- Respect `prefers-reduced-motion` (skip bounce/exit transitions).

### Sync surfaces (do not drift)

| Surface | Role |
| --- | --- |
| `src/renderer/index.html` `#boot-splash` | Production loading visuals (source of truth for first paint) |
| `BootstrapSplashShell.module.css` | Storybook / error parity for ball motion + sphere look |
| `BOOTSTRAP_SPLASH_BOUNCE_MS` | Period constant for optional Storybook phase-lock delay |
| `useBootstrapSplashProgress` | Visual progress only (~160ms tick, integer %, asymptote ≤88 until ready) |

When changing bounce duration, keyframes, shadow shape, or brand stops — update **all** sync surfaces + this contract in the same change.

### Performance / anti-jank (mandatory)

1. Prefer compositor-friendly properties (`transform`, `opacity`) for the bounce loop.
2. Do **not** put animated `filter` / layout-affecting properties on `.boot-ball` / `.boot-shadow`.
3. Do **not** drive the production bounce with React / `react-spring` / `framer-motion` — splash must work pre-React; JS springs also compete with bootstrap on the main thread.
4. Progress updates must stay cheap: throttle ticks, skip identical `transform` writes in `bootSplashDom`.
5. Keep animation timing **`linear`** and encode gravity in keyframe **positions** (parabolic samples). A single ease on the whole cycle fights ballistic motion.
6. Do **not** swap bounce → settle via CSS `@keyframes` on `data-settled` — use `settleSplashBallMotion` (freeze → transition) only.

## Boundaries

- No SIP / Electron IPC / repositories / Use Cases in splash UI or `bootSplashDom`.
- Bootstrap gate still awaits `initialize` (`useAccountBootstrap`).
- `BootstrapSplashShell` `variant="loading"` remains for Storybook/tests only — not used on the production loading path.

## Evidence / tests

- `bootSplashDom.test.ts`
- `useBootSplashController.test.ts`
- `useBootstrapSplashProgress.test.ts`
- `startupSplashColors.test.ts` (bounce period + brand stops)
- `BootstrapSplashShell.test.tsx` (error + Storybook loading)
- Storybook: `Shells/BootstrapSplashShell`
