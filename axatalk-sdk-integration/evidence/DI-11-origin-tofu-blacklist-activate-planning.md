# DI-11 — Origin TOFU / Blacklist / Activate Consent (planning)

**Status:** planning + ADR decisions frozen (2026-07-21 docs refactor)  
**ADR:** `docs/softphone/adr/ADR-0018-sdk-origin-tofu-blacklist-activate-consent.md` (**Accepted**)  
**Work unit:** `axatalk-sdk-integration/WORK-UNITS.md` — DI-11 `pending`  
**Code:** not started — wait for DI-10 gate policy before production gateway/Settings merges

## Agreed product rules (frozen for implementers)

1. SDK loopback gateway always listens at process start (primary instance); Settings
   enable/disable listener toggle removed (env `AXATALK_SDK_GATEWAY=0` kill-switch only).
2. Origin states: `unknown` | `allowed` | `denied`. Exact string match only.
3. First `unknown` contact → **renderer modal** Allow/Deny (Origin trust only — not pairing).
   Allow → `allowed` + socket continues + base per-Origin capability matrix
   (`call_controller` non-privileged; `account.activate` off).
   Deny → wire `forbidden` + `origin_denied`, close, blacklist.
4. Repeat from blacklist → reject upgrade (no socket); SDK maps to client `origin_blocked`.
5. **Unblock:** if Origin was previously `allowed` (matrix retained) → restore `allowed` +
   matrix; if first-contact Deny only → restore `unknown` (modal again).
6. Cannot add/edit Origin allow/policy or capability matrix while blacklisted — Unblock
   first. Quick blacklist retains matrix (read-only) but ignores it while denied.
7. Settings → Integrations → Axatalk SDK available pre-auth; OCP Module stays gated.
8. Activate: opaque `profileRef`, no passwords; matrix off → immediate `forbidden` +
   `permission_denied` (no modal). Matrix on → renderer consent modal **every** login
   (one activate per Allow). Consent Deny → activate-disabled until Settings re-enable.
   Pending guard: no parallel activate modals; duplicate → primary `conflict`; any
   dismiss/choice clears pending.
9. Discovery CORS: ACAO for `unknown` + `allowed` only; never for `denied`.
10. F-011 / P12 close requires DI-11 `/sdk-review` PASS (or waiver), not DI-10 alone.
11. Raw SIP/OCP credential login via SDK **deferred**.
    `window.hide` was still unavailable at planning time — **superseded 2026-07-27**
    (ADR-0013 amendment / `DI-05-window-hide-product.md`).

## Docs updated (2026-07-21 refactor)

- ADR-0018 (frozen decisions)
- ADR-0009, ADR-0015, ADR-AF-004 amendments / hygiene
- PROTOCOL / SECURITY / errors / pairing / saved-profile guides
- P12 handoff Completion + Next prompt; WORK-UNITS DI-11 checklist; TEST-MATRIX rows
- Feature Registry / STATUS pointers unchanged (F-011 remains `in progress`)

## Non-goals

- Implementing code in the docs session
- Closing F-011 / P12 / DI-10 / DI-11
- Re-disabling `window.hide` after ADR-0013 product enablement (2026-07-27)
- npm publish / SemVer bump
