# P11 First-Run Sign-In CTA

- Purpose: guide unregistered users from compact shell idle zone to Settings → Account.
- Inputs: `isSipRegistered` shell flag; `onOpenAccount` → `openSettings("account")`; empty saved-profile list on Account.
- Outputs: idle CTA only (`call-idle-sign-in-cta`, `Button` secondary) under needs-sign-in copy; Account hint (`settings-account-first-run-hint`); light/dark via surface tokens (not filled accent).
- Non-goals: Dialpad duplicate CTA; RegistrationStatusDot click; full onboarding wizard; auto-login; UI Kit EmptyState primitive.
- Related: F-016, F-001, F-024; ADR-AF-003/004; guides `User-Guide-RU.md` §3, `install-instruction.md` §4.
