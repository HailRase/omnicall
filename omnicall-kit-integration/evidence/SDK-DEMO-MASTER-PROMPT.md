# MASTER PROMPT — OmniCall Kit Demo Stand (`sdk-demo/`)

Copy everything below the line into a **new Cursor Agent** chat (Agent mode).  
Language for the agent: English for code/docs inside `sdk-demo/`.  
Final user-facing checklist at the end of the agent reply: **short Russian bullet points**.

---

```markdown
# AGENT TASK: Build disposable `sdk-demo/` — expert OmniCall Kit live demo stand

## Role

You are a senior front-end + integration engineer. Build a **beautiful, self-contained, deletable**
demo stand that exercises the real OmniCall Desktop local gateway via `@softomnitel/omnicall-kit`.

This is **not** the fake-peer `examples/crm-pairing-lite`. Connect to the **live softphone**.

## Hard constraints (non-negotiable)

1. **Folder:** create only `sdk-demo/` at the softphone repo root.
2. **Disposable:** deleting `sdk-demo/` must leave the product clean.
   - Do **not** add `sdk-demo` to root/workspaces `package.json`, Feature Registry, STATUS,
     CI, electron-builder, or i18n catalogs.
   - Do **not** change desktop `src/`, `omnicall-kit/packages/**` production API, or SemVer.
3. **No heavy installs:** no Vite/Webpack/React/Tailwind/shadcn/npm UI kits inside `sdk-demo`.
   - CSS / fonts / icons: **CDN `<link>` / `<script>` only** (e.g. Inter or similar from a
     reputable CDN; Lucide or Heroicons via CDN if needed).
   - Prefer **zero `sdk-demo/package.json`**. If unavoidable, at most a tiny helper with
     **zero dependencies** (Node built-in `http` static server). No `node_modules` required
     to open the demo after the parent SDK is already built.
4. **Load the local SDK** (packages are not on public npm yet):
   - Packages: `@softomnitel/omnicall-kit` + `@softomnitel/omnicall-protocol` under `omnicall-kit/`.
   - Build parent first if needed: `cd omnicall-kit && npm run build`.
   - Browser: ESM + **import map** (or equivalent) pointing at built `dist/` files under
     `../omnicall-kit/packages/{sdk,protocol}/dist/…` and protocol’s `zod` dependency
     (resolve from `omnicall-kit/node_modules/zod` or vendor a single ESM path — document it).
   - Use SDK `createBrowserWebSocketTransport` (or omit `transportFactory` for the browser
     default). Do **not** invent a second reconnect layer on the raw `WebSocket`.
5. **Security / product rules (must follow):**
   - Never request privileged caps at pairing: `account.activate`, `window.hide`.
   - Never put SIP passwords / OCP apiKeys in the page.
   - PoP keys: IndexedDB store in browser (`createIndexedDbPopKeyStore`) — never
     `localStorage` / `sessionStorage`.
   - `window.show` / `window.getState` always (when `window.show` granted).
   - `window.hide` is **product-available** (ADR-0013 amended 2026-07-27): never request at
     pairing; enable via OmniCall Settings → SDK Origin matrix; call
     `client.window.hide({ expectedRevision })`. Demo must wire the button when grant is
     present; without grant show disabled + “enable in Origin matrix”. On `conflict` during
     a call, explain telephony-busy deny; recovery = tray Show / `window.show`.
   - Call mutations always pass fresh `expectedRevision` from last snapshot/event.
   - Errors: show `code` / `retryable` / `currentRevision` via `isOmniCallClientError` —
     never dump secrets or raw wire dumps.
6. **Origin:** demo must be served from an exact Origin the desktop allowlists, default:
   `http://127.0.0.1:8765` (same as DI-10 browser smoke). Configurable in UI.
7. **Default WS URL:** `ws://127.0.0.1:17341/omnicall/v1/ws` (editable in UI). Optional
   discovery helper if documented in desktop/SDK guides — do not invent insecure endpoints.

## Read first (repo)

1. `omnicall-kit/docs/guide/pairing-quick-start.md`
2. `omnicall-kit/docs/guide/api-reference.md`
3. `omnicall-kit/docs/guide/capabilities.md`
4. `omnicall-kit/docs/guide/events.md`
5. `omnicall-kit/docs/guide/errors.md`
6. `omnicall-kit/docs/guide/logout-workflow.md`
7. `omnicall-kit/docs/guide/saved-profile-activation.md`
8. `omnicall-kit/etc/api/sdk.api.md` (public surface truth — **54** symbols)
9. `docs/softphone/adr/ADR-0013-sdk-window-policy-and-signin.md`
10. Existing smoke reference (patterns only): `omnicall-kit-integration/scripts/di10-browser-smoke*`

## Deliverable structure (suggested)

```txt
sdk-demo/
  README.md                 # English tech notes + how to run
  HOW-TO-RU.md              # Short Russian operator checklist (also summarized in chat)
  server.mjs                # Optional zero-dep static server on 127.0.0.1:8765
  index.html                # Shell / navigation
  styles.css                # Local CSS (or mostly CDN + thin local overrides)
  app.mjs                   # Shared client bootstrap, transport, logging
  pages/ or sections/
    01-connect-pair.html|.mjs
    02-snapshot-events.html|.mjs
    03-window.html|.mjs
    04-calls.html|.mjs
    05-operator.html|.mjs
    06-logout.html|.mjs
    07-activate-profile.html|.mjs   # privileged grant path honesty
    08-errors-reconnect.html|.mjs
  assets/                   # optional static only
```

Single-page with tabbed sections is also OK if UX stays crisp — still cover **all** scenarios below.

## UX / UI bar (expert)

- One cohesive composition (not a dashboard of random cards).
- Strong product identity: **OmniCall Kit Demo** as hero-level title.
- Expressive typography via CDN font (avoid Inter/Roboto/Arial/system as the only voice if
  you can pick a distinctive pair; still keep it professional and readable).
- Atmosphere: subtle gradient / soft pattern background — not flat gray, not purple-AI cliché,
  not cream+terracotta cliché, not newspaper layout.
- Motion: 2–3 intentional transitions (state pill, log appear, button press) — no noise.
- Clear **connection state ladder** always visible: idle → connecting → pairingRequired →
  authenticating → ready → reconnecting → failed (match SDK states).
- Live **event/activity log** (ring buffer, newest first, copyable codes only).
- Snapshot panel: revision, registration summary, active call summary — **redacted**, no PII dump.
- Buttons disabled with reason tooltips when capability/state blocks them.
- Keyboard-friendly, sufficient contrast, works in Chromium/Edge.
- Mobile-usable width optional; desktop-first is fine.

## Feature scenarios (implement all as interactive demos)

### A. Connect & pair
- Connect / Disconnect
- Show pairing-required banner: “Approve this Origin in OmniCall → Settings → Integrations → SDK”
- Display granted capabilities after ready
- Exact Origin field + WS URL field + application name/version

### B. Snapshot & events
- `getSnapshot()` button
- Subscribe to public events (`call:incoming`, registration, permission, etc. per events guide)
- Auto-refresh revision from snapshot/events

### C. Window
- `window.show`, `window.getState`
- `window.hide({ expectedRevision })` when `window.hide` granted; disabled + matrix hint otherwise
- Demo conflict path: busy call → hide denied; idle → hide + restore via show/tray

### D. Calls (full matrix)
- Originate (destination input — use opaque-friendly examples like `ext:1001` or dial string)
- Answer / Reject / Hangup / Hold / Resume / Mute / Unmute / DTMF
- Always bind `expectedRevision`; on stale revision, surface error and refresh snapshot
- Reflect call id from events/snapshot in the UI

### E. Operator (optional OCP)
- `getReasons`, `changeStatus` ready/break
- Honest empty/error states if OCP not available

### F. Logout workflow
- `logout` → show `interaction_required` honesty (`requiresReason` + reasons) → retry with
  `reasonId` / abandon path (do not call again) per logout-workflow guide

### G. Activate profile (privileged)
- UI that explains operator must issue grant in desktop Settings first
- Call activate only with opaque `profileRef` — never credentials
- If grant missing, show typed forbidden and next step

### H. Errors & reconnect
- Buttons or guided path to demonstrate disconnect during idle vs during call
  (disconnect must not auto-hangup)
- Map a few common error codes to human hints (from errors guide)

## Run story (must work)

Document and verify:

```bash
# 1) Build SDK packages (repo root)
cd omnicall-kit
npm ci --engine-strict=false   # if needed
npm run build

# 2) Start OmniCall Desktop (dev or packaged) with gateway enabled and Origin allowlisted
# Example env for dev:
#   OMNICALL_SDK_GATEWAY=1
#   OMNICALL_SDK_ALLOWED_ORIGINS=http://127.0.0.1:8765
# Operator must also be able to manage Origins in Settings after SIP sign-in.

# 3) Serve demo
cd ../sdk-demo
node server.mjs
# open http://127.0.0.1:8765
```

If Settings Origins UI is the primary path, document **both** env allowlist and Settings UI.

## Out of scope

- Publishing npm packages / renaming scopes
- Re-disabling `window.hide` / inventing permanent product deny
- Changing softphone Domain / Call Engine
- Transfer R6 backlog
- Marking F-011 implemented
- Fake-peer-only demos (unless a tiny offline mock toggle — default must be live desktop)

## Acceptance checklist

- [ ] `sdk-demo/` only; removable with no repo breakage
- [ ] No heavy bundler/UI framework installs
- [ ] Live WS to desktop works after Origin approve
- [ ] All scenarios A–H present with polished UX
- [ ] Hide works when matrix-granted; honest disabled without grant; busy → conflict
- [ ] README.md (EN) + HOW-TO-RU.md (short RU)
- [ ] Agent final chat reply: **short Russian bullet list** — what to do, what to test,
      how to allow SDK ↔ softphone communication

## Final chat reply format (mandatory)

Respond to the human in **Russian**, short bullets:

1. Как запустить demo (3–6 шагов)
2. Как разрешить связь в softphone (Settings / Origin)
3. Что можно протестировать по разделам
4. Типичные проблемы и быстрый фикс
5. Как удалить demo (`удалить папку sdk-demo`)

No long essays. No English in that closing checklist.
```
---

## Paste tip

Use Agent mode on branch `feature/omnicall-kit` with workspace root = softphone repo.
)
