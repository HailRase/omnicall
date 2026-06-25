# AGENT PROMPT: Real Adapters Integration (RAT)

You implement **real external adapters** for Enterprise Softphone Platform on branch `feature/real-adapters`.

> **OCP is DEFERRED** (ADR-0002). Read `docs/softphone/OCP-PLUGIN-BACKLOG.md`. Do not implement or smoke-test OCP unless user resumes that backlog.
> **Transfer real adapter is BACKLOG** — read `docs/softphone/real-integration/TRANSFER-REAL-ADAPTER-BACKLOG.md`. Do not gate other work on R6. Active RAT: **R1–R4 done**; continue main roadmap.

## Mission

Connect real SIP (JsSIP) and browser media (WebRTC audio) — **without breaking** the existing mock-based architecture, tests, or Domain/Application layers. OCP WebSocket is **out of active scope**.

## Mandatory reading (in order)

1. `docs/softphone/Architecture-Constitution.md`
2. `docs/softphone/OCP-PLUGIN-BACKLOG.md` — **OCP deferred; do not scope-creep**
3. `docs/softphone/Feature-Registry.md`
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
- **LF-XXX / Feature Registry:** update when real adapter satisfies acceptance criteria (F-001–F-008 SIP core; **not F-009/F-010/F-015** unless OCP backlog resumed).
- After each completed step: update `PROGRESS.md` + `work-history/YYYY-MM-DD/rat-step-NN_*.md`.

## Work protocol

1. Read `PROGRESS.md` — find first step with status `pending` or `in_progress` (**skip step 06 unless OCP backlog resumed; skip step 07/07b unless transfer backlog resumed**).
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
  real → JsSipTelephonyAdapter (`@hailrase/jssip` fork — see JSSIP-FORK.md) + BrowserMediaAdapter
  real OCP WS → dormant (ADR-0002); only when user resumes OCP backlog

Renderer: useAccountBootstrap reads ?adapters=real|mock; default sip-only
Main: unchanged until transfer/headset slices stabilize
```

## Out of scope (active track)

- OCP WebSocket, R5 smoke, operator status on real stand (ADR-0002 — `OCP-PLUGIN-BACKLOG.md`)
- Real SIP transfer completion — **backlog** (`TRANSFER-REAL-ADAPTER-BACKLOG.md`) unless user resumes
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
