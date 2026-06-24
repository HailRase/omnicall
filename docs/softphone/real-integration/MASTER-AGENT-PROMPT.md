# AGENT PROMPT: Real Adapters Integration (RAT)

You implement **real external adapters** for Enterprise Softphone Platform on branch `feature/real-adapters`.

## Mission

Connect real SIP (JsSIP), browser media (WebRTC audio), and later OCP WebSocket — **without breaking** the existing mock-based architecture, tests, or Domain/Application layers.

## Mandatory reading (in order)

1. `docs/softphone/Architecture-Constitution.md`
2. `docs/softphone/Feature-Registry.md`
3. `docs/softphone/UX-UI-Design-Blueprint.md`
4. `docs/softphone/real-integration/00-SNAPSHOT.md`
5. `docs/softphone/real-integration/PROGRESS.md` — resume from first unchecked step
6. `docs/softphone/real-integration/JSSIP-FORK.md` — `@hailrase/jssip` fork policy
7. Current step file: `docs/softphone/real-integration/step-NN-*.md`

## Non-negotiable rules

- **Mock remains default.** `npm run test`, `npm run lint`, `npm run typecheck` must pass before every commit.
- **Adapter mode switch** via `createSoftphoneComposition({ mode: "mock" | "real" })` — never duplicate Use Cases.
- **No `any`**, no `@deprecated` APIs, no `@ts-ignore`.
- **JsSIP / WebSocket / DOM audio only inside Adapters** — never in Domain, Use Cases, or React components.
- **UI stays presentational** — projections + disabled reasons; user actions → facade Use Cases only.
- **Do not add lines to AccountBootstrapFacade** except wiring new ports if unavoidable; prefer bootstrap factory.
- **Secrets:** never log passwords/tokens; use `.env.local` at repo root (gitignored) for dev SBC credentials.
- **LF-XXX / Feature Registry:** update when real adapter satisfies acceptance criteria (extend F-001, F-002, F-003, F-009 — do not create orphan features).
- After each completed step: update `PROGRESS.md` + `work-history/YYYY-MM-DD/rat-step-NN_*.md`.

## Work protocol

1. Read `PROGRESS.md` — find first step with status `pending` or `in_progress`.
2. Open matching `step-NN-*.md` — implement only that scope.
3. Run `npm run test && npm run lint && npm run typecheck`.
4. Manual smoke per `SMOKE-CHECKLIST.md` for that slice (document results in PROGRESS).
5. Mark step `done` in PROGRESS with: files changed, test count, smoke result.
6. Stop. Do not start next step unless user asks.

## UX requirements (call center)

Every slice must preserve:

- Visible registration state (LF-011): Online / Offline / DND via projection
- Disabled controls with reason (not registered, OCP reserved, call in progress, etc.)
- Connection overlay on transport loss (LF-057) — real adapter must fire disconnect hooks
- Incoming modal: caller ID, answer/reject, auto-answer countdown, reject reason when OCP
- Operator status hidden in SIP-only; visible in OCP mode
- Keyboard + `data-testid` on critical controls
- No raw SIP session state in React

## Architecture target (incremental)

```txt
createSoftphoneComposition(mode)
  mock → existing Mock* gateways (CI default)
  real → JsSipTelephonyAdapter (`@hailrase/jssip` fork — see JSSIP-FORK.md) + BrowserMediaAdapter (+ later OCP WS)

Renderer: useAccountBootstrap reads ?adapters=real|mock
Main: unchanged until R5+ (optional later: move composition to main)
```

## Out of scope until step-07

- Blind/attended transfer on real SIP
- Headset WebHID
- Call history persistence
- Full E2E harness

## If port contract is insufficient

1. Document gap in step file.
2. Propose minimal port extension + ADR in `docs/softphone/adr/`.
3. Do not leak JsSIP types through port.

## Verification commands

```bash
npm run test
npm run lint
npm run typecheck
npm run dev
```

Manual smoke: `?adapters=real` after step 02+.
