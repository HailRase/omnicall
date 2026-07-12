# Changelog

Public release history for **Axatalk** distribution builds.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning: SemVer. Git tag: `v<version>`.

## [0.10.2] - 2026-07-12

### Fixed

- upgrade release version

## [0.10.1] - 2026-07-12

### Fixed

- Video codec prority
- Sync video codec settings with new sessions

## [0.10.0] - 2026-07-12

### Added

- Headset integration via Web HID — answer, hangup, mute, hold, and LED sync for supported Jabra and Poly devices; headset settings panel
- Video calls — Video call button on dialpad, camera and screen sharing, fullscreen session view, answer incoming calls with video, Settings → Video for devices and preview
- Call history — outcome labels, end reason, and call duration display

### Removed

- Legacy operator platform integration; SIP-only telephony is the product path

### Fixed

- Headset mute, hold, and LED synchronization reliability
- Video call UX — screen-share source picker, inbound video-answer detection, fullscreen controls
- Contact CSV export on frameless Windows builds

## [0.9.0] - 2026-07-08

### Added

- Global incoming call overlay — iPhone-like top-center banner on all routes except dialpad when the in-context incoming card is visible; answer/decline actions; tap navigates to the main call surface
- Frosted-glass banner with motion, semantic incoming-call tokens, and truncated long caller names

### Fixed

- Contact CSV import wired through the real bootstrap gateway

## [0.8.0] - 2026-07-08

### Added

- Call history sidebar — list with missed filter, redial, and date grouping (F-013)
- Contacts sidebar — list with search, add/edit/delete, contact details, and quick call (F-025)
- Shell navigation for contacts and history over the dialpad via React Router; avatar menu entries (F-016)
- Dialpad contacts shortcut in the number input when the field is empty

### Changed

- Compact list UI for contacts and call history (avatars, sublines, quick call)
- Call history shows call duration for completed calls and clock time for missed or unanswered calls
- Contacts and history are disabled in the avatar menu and dialpad shortcut until SIP registration succeeds

## [0.7.1] - 2026-07-07

### Added

- Window resize is allowed only while Settings is open; compact width and height restore on exit (F-016)
- Settings numeric fields use UI Kit Input via `SettingsNumberInput`

### Changed

- macOS Dock/Launchpad icon uses Apple HIG safe padding (824×824 artwork on a 1024 canvas)
- Windows taskbar runtime icon is slightly larger (`windows-theme-icons`, +12.5% artwork vs macOS padded size)

## [0.7.0] - 2026-07-07

### Added

- macOS window controls — custom traffic lights (Close, Minimize, Reload); no maximize button; reload sits in the green button slot without a tooltip
- Settings — fullscreen overlay with window controls in the top chrome bar; settings content uses full window width
- macOS Edit menu — standard copy, paste, cut, select all, and undo shortcuts in text fields

### Changed

- Update available notification — positioned at the top of the window
- Tooltips — long labels wrap instead of overflowing

## [0.6.1] - 2026-07-07

### Fixed

- Delete saved SIP profile confirmation dialog now appears above the fullscreen Settings overlay
- Cancel and Delete text buttons in the delete-profile confirmation dialog (replacing icon-only controls)

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
