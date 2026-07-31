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
   - **min visible dwell** (`BOOTSTRAP_SPLASH_MIN_VISIBLE_MS` = 4000): after bootstrap `ready`, keep bounce + asymptote ≤88 until elapsed ≥ min (or skip when `prefers-reduced-motion: reduce`); does **not** delay `initialize`
   - `data-settled` at 100%, then `dismissBootSplash` after settle (~700ms)
4. On ready after min dwell + settle: mount `SoftphoneReadyShell` **under** `#boot-splash`, set `data-exiting` for a CSS opacity crossfade (`BOOT_SPLASH_EXIT_MS` ≈ 420ms), then `dismissBootSplash`. Never hard-remove the splash in the same frame as the ready shell (avoids a visual glitch).
5. On `error`: dismiss `#boot-splash` immediately, then show `BootstrapSplashShell` error (min dwell does **not** apply).
6. Do not reintroduce HTML↔React loading handoff / phase-sync for production loading.
7. Respect `prefers-reduced-motion` (skip bounce/exit transitions and min visible dwell).

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
| Ball look | Brand gradient + **subtle static volume** (soft highlight / depth radials + light inset rim). No `perspective` / `rotateX` — bounce motion stays 2D ballistic |
| Loading text | Pre-React: `navigator.language` map; after React: `bootstrap.loading` via `setBootSplashMessage` |
| Progress | Indeterminate until React; then determinate (`data-progress-mode="determinate"`) |

## Motion

- Bounce **1000ms** on `#boot-splash` only (`BOOTSTRAP_SPLASH_BOUNCE_MS` in `startupSplashColors.ts`).
- Timing: **`linear`** + **ballistic Y samples** `Y ≈ H·4·t·(1−t)` at equal time steps — fast leave from ground, decelerate to apex, accelerate into landing (real gravity feel). Do **not** space keyframes evenly in height.
- `0%` transform **must equal** `100%` (seamless loop, no ground dwell). Contact squash only near 0%/100%.
- Animate `transform` / `opacity` only on the bounce/shadow layers.
- **Min visible dwell (UI-only):** splash must remain in loading/bounce mode for at least `BOOTSTRAP_SPLASH_MIN_VISIBLE_MS` (4000) from progress-hook start, even if bootstrap is already `ready`. After that (or immediately if reduced-motion), progress may hit 100%. Bootstrap `initialize` is never blocked by this timer.
- **Settle (no teleport):** when progress hits 100%, `settleSplashBallMotion` freezes the **current** computed transform, then eases to the rest pose (`BOOT_SPLASH_SETTLE_MS` ≈ 420ms). Never replace the bounce with a settle `@keyframes` mid-flight — that teleports the ball from apex to ground.
- Sequence on ready: wait remaining min dwell (if any) → settle ball (`data-settled`, ~700ms hold including freeze→rest) → mount ready shell under splash → exit crossfade (`data-exiting` / `beginBootSplashExit`, ~420ms) → `dismissBootSplash`.
- Opaque `#boot-splash` background (synced with `STARTUP_SPLASH_BG_*`) so the crossfade does not flash through mixed layers.
- Respect `prefers-reduced-motion` (skip bounce/exit transitions and min visible dwell).

### Sync surfaces (do not drift)

| Surface | Role |
| --- | --- |
| `src/renderer/index.html` `#boot-splash` | Production loading visuals (source of truth for first paint) |
| `BootstrapSplashShell.module.css` | Storybook / error parity for ball motion + sphere look |
| `BOOTSTRAP_SPLASH_BOUNCE_MS` | Period constant for optional Storybook phase-lock delay |
| `BOOTSTRAP_SPLASH_MIN_VISIBLE_MS` | Min bounce/loading visibility before settle (UI dwell only) |
| `useBootstrapSplashProgress` | Visual progress only (~160ms tick, integer %, asymptote ≤88 until min dwell + ready) |

When changing bounce duration, keyframes, shadow shape, or brand stops — update **all** sync surfaces + this contract in the same change.

### Performance / anti-jank (mandatory)

1. Prefer compositor-friendly properties (`transform`, `opacity`) for the bounce loop.
2. Do **not** put animated `filter` / layout-affecting properties on `.boot-ball` / `.boot-shadow`.
3. Do **not** drive the production bounce with React / `react-spring` / `framer-motion` — splash must work pre-React; JS springs also compete with bootstrap on the main thread.
4. Progress updates must stay cheap: throttle ticks, skip identical `transform` writes in `bootSplashDom`.
5. Keep animation timing **`linear`** and encode gravity in keyframe **positions** (parabolic samples). A single ease on the whole cycle fights ballistic motion.
6. Do **not** swap bounce → settle via CSS `@keyframes` on `data-settled` — use `settleSplashBallMotion` (freeze → transition) only.

## Timing constants (do not invent locals)

| Constant | Value | Owner |
| --- | --- | --- |
| `BOOTSTRAP_SPLASH_BOUNCE_MS` | 1000 | `startupSplashColors.ts` |
| `BOOTSTRAP_SPLASH_MIN_VISIBLE_MS` | 4000 | `startupSplashColors.ts` |
| `BOOT_SPLASH_PROGRESS_SETTLE_MS` | 700 | `useBootstrapSplashProgress.ts` (hold after 100%) |
| `BOOT_SPLASH_SETTLE_MS` | 420 | `bootSplashDom.ts` (ball freeze→rest CSS) |
| `BOOT_SPLASH_EXIT_MS` | 420 | `bootSplashDom.ts` (opacity crossfade) |

Min visible dwell is **orthogonal** to bootstrap readiness: work finishes when it finishes; splash hide waits `max(ready, startedAt + MIN_VISIBLE)` then settle + exit.

## Boundaries

- No SIP / Electron IPC / repositories / Use Cases in splash UI or `bootSplashDom`.
- Bootstrap gate still awaits `initialize` (`useAccountBootstrap`).
- Min visible dwell must not delay, wrap, or re-gate `initialize` / composition.
- `BootstrapSplashShell` `variant="loading"` remains for Storybook/tests only — not used on the production loading path.

## Evidence / tests

- `bootSplashDom.test.ts`
- `useBootSplashController.test.ts` (min dwell before settle + exit)
- `useBootstrapSplashProgress.test.ts` (min dwell, post-dwell ready, reduced-motion skip)
- `startupSplashColors.test.ts` (bounce period + min visible + brand stops)
- `BootstrapSplashShell.test.tsx` (error + Storybook loading)
- Storybook: `Shells/BootstrapSplashShell`
