# Changelog

Public release history for **Axatalk** distribution builds.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: SemVer. Git tag: `v<version>`.

## [0.6.0] - 2026-07-07

### Added

- Bulgarian language option in Settings → General
- Delete a saved SIP account profile from its tab (trash icon with confirmation dialog)

### Changed

- Settings panels use refreshed UI Kit controls (buttons, switches, selects, and profile tabs)
- Action notifications — stacked toasts with success and error icons; each attempt shows its own message
- Update available prompt — Alert-style card with download icon at the top of the window

## [0.5.1] - 2026-07-06

### Changed

- Update available notification — floating card overlay at the top instead of a header strip; Download and Later actions with icons aligned to the right below the message

## [0.5.0] - 2026-07-06

### Added

- Desktop shell controls on Windows and Linux — minimize, reload, and close in a custom titlebar; reload performs a controlled app restart after full call and SIP cleanup
- Stacked header layout — window controls on top, account avatar and SIP status below
- Removed native File/Edit/View menu on Windows and Linux; maximize and fullscreen disabled
- Shutdown safety — if cleanup fails on close or restart, the app stays open and shows an error so you can retry

## [0.4.0] - 2026-07-06

### Added

- Saved SIP account profiles for quick sign-in — save account identity locally (password is never stored), switch between profiles via tabs in Settings → Account, sign in with password only on saved profiles, confirm before switching registered accounts, delete with confirmation

## [0.3.0] - 2026-07-06

### Added

- Per-account settings profiles — theme, language, multi-call, auto-answer, SIP recovery, and codec preferences are saved independently for each SIP account you authorize; settings restore when you sign back in

## [0.2.0] - 2026-07-06

### Added

- Codec preferences panel in Settings — drag-and-drop audio codec order, enable and disable (except DTMF)

### Changed

- Video codecs in Settings are read-only (no reorder or toggle)
- Audio codec order applied on new RTC sessions
- Public distribution README in English; GitHub Releases include structured release notes generated from this changelog

### Fixed

- Codec preference wiring race on incoming and outgoing calls; SDP fallback when codec preferences cannot be applied

## [0.1.3] - 2026-07-05

### Fixed

- Update banner "Later" choice is remembered across app restarts until the next version is available

## [0.1.2] - 2026-07-05

### Changed

- Update overlay redesigned as a centered modal with scrim, icon, version badge, and improved typography (light and dark themes)

### Fixed

- "Download" on the update overlay dismisses the prompt and remembers the choice until the next release

## [0.1.1] - 2026-07-05

### Fixed

- "Open download page" now opens the latest releases page instead of a direct per-platform installer URL
- Background update checks no longer write error or unavailable states into settings
- "Later" on the update banner is remembered until the next version
- Registration status indicator alignment next to the account avatar
- Primary button text colour on the update banner in all themes

## [0.1.0] - 2026-07-05

### Added

- Background update check on startup with a non-blocking "Update available" banner (manual install)
- Interface localisation (Russian, English, French, German) and language selection in settings
- Improved tooltips and settings sidebar navigation
- Windows MSI installer; corrected Linux `.deb` menu icons

### Changed

- SIP transport and registration state handling; manual re-registration and recovery after failures
- System State panel: clearer server terminology; SIP journal controls removed from the panel
- Renderer styling consistency (CSS Modules conventions)

### Fixed

- SIP transport reconnect semantics and 403 registration handling
- SIP transport timeout, manual re-register, and registration recovery at runtime
- Account panel and projections after logout
- Immediate SIP journal clear feedback in System State

## [0.0.3] - 2026-07-01

### Changed

- Distribution pipeline publishes installers to this public repository
- Release assets filtered to signed installers only (no unpacked build folders)

## [0.0.2] - 2026-07-01

### Added

- Automated installer publication on version tag via CI
- Linux installation guidance: AppImage (recommended) and `.deb` via terminal

### Changed

- Separate CI workflows for pull-request checks and release builds
- Updated end-user download and installation instructions

### Fixed

- Reliable CI builds without unpublished electron-builder upload steps

## [0.0.1] - 2026-07-01

### Added

- Initial Axatalk distribution (Windows, macOS, Linux installers)
- Manual in-app update check using the public update manifest (no auto-install)
- Desktop packaging for Windows, macOS, and Linux

### Fixed

- CI packaging no longer attempts unpublished GitHub uploads during build
