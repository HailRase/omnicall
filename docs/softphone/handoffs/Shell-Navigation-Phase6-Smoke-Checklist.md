# Shell Navigation Phase 6 — Manual Smoke Checklist

> Run after automated gate (`npm run test`, `lint`, `typecheck`, `i18n:check`, `ui:catalog`) passes.

## Baseline (must not regress)

- [ ] App boots to dialpad; SIP registration flow unchanged
- [ ] Outgoing call from dialpad works
- [ ] Incoming call banner/card visible from every screen below
- [ ] Answer/reject use existing controls; call state persists after answer
- [ ] Active call controls (hold/mute/hangup) remain in Context/Controls zones
- [ ] Settings overlay opens; active call context stays visible during established call
- [ ] Notifications/toasts still render
- [ ] Update check flow unchanged

## Navigation (F-013 / F-025 / F-016)

- [ ] `#/history` opens history panel; dialpad/call zones stay mounted
- [ ] History empty/loading/populated states render without crash
- [ ] Redial from history initiates outgoing call and returns to dialpad
- [ ] Redial disabled when SIP not registered or active call + multi-sessions off
- [ ] `#/contacts` opens contacts sidebar over dialpad
- [ ] `#/contacts/:id` details and `#/contacts/:id/edit` edit render as sidebar
- [ ] Invalid contact id shows not-found inside sidebar (no crash)
- [ ] Create/edit/delete contact persists in session (in-memory)
- [ ] Call contact dials primary phone and focuses dialpad
- [ ] `#/settings` and `#/settings/:section` open settings overlay
- [ ] Closing settings returns to prior route or dialpad fallback

## Incoming call from secondary screens

- [ ] Incoming call visible while history panel open
- [ ] Incoming call visible while contacts list/details/edit open
- [ ] Incoming call visible while settings overlay open
- [ ] Answer from contacts sidebar closes/focuses dialpad per implemented rule

## Overlay layering rules (automated regression)

- **Contacts/history (`ShellOverlaySheet` sidebar):** non-blocking backdrop — `ContextZone` incoming call controls stay clickable; close via panel chrome or Escape.
- **Settings (`SettingsFullscreenOverlay`):** intentional fullscreen modal with blocking scrim above route sidebars (`--z-shell-modal-overlay`); active call context stays mounted underneath but settings capture focus until closed.

## Locales

- [ ] Switch language ru/en/fr/de/bg on history and contacts surfaces — no missing keys
