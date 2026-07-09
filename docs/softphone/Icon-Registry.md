# Icon Registry

**F-016** UI icon semantics. Agents: read [`guides/Icon-Agent-Guide.md`](../../guides/Icon-Agent-Guide.md) before UI work.

## Rules

1. One **semantic id** per distinct UI meaning (not per Lucide glyph).
2. Prefer `lucide-animated` when `animated` column is set; else `lucide-react`.
3. Update this table **and** `iconCatalog.ts` in the same change.
4. Icon-only buttons: `aria-label` on button; icon decorative; hover tooltip via `IconTooltip` / `IconControlButton` (300ms delay).

## Registry

| Semantic ID | Purpose | Static | Animated | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| `shell.settings` | Open settings overlay | `Settings` | `SettingsIcon` | `UserAvatarMenu`, `SettingsSidebar` | active |
| `shell.diagnostics` | Settings diagnostics section | `Activity` | `ActivityIcon` | `SettingsSidebar` | active |
| `shell.restart` | Controlled app restart | `RotateCcw` | `RotateCcwIcon` | `ShellWindowControls` | active |
| `shell.window.minimize` | Minimize frameless window | `Minus` | — | `ShellWindowControls` | active |
| `shell.window.close` | Close frameless window | `X` | — | `ShellWindowControls` | active |
| `shell.nav.back` | Navigate back in shell panel | `ChevronLeft` | `ChevronLeftIcon` | `ShellDialpadPanel` | active |
| `shell.contacts` | Open contacts list | `Users` | — | `Dialpad` | active |
| `contact.add` | Add new contact | `UserRoundPlus` | — | `ContactsListPanel` | active |
| `form.password.show` | Reveal password input | `Eye` | — | `AccountPasswordField` | active |
| `form.password.hide` | Mask password input | `EyeOff` | — | `AccountPasswordField` | active |
| `settings.account` | Settings account section | `User` | `UserIcon` | `SettingsSidebar` | active |
| `account.profile.delete` | Delete saved SIP profile | `Trash2` | — | `SavedAccountProfileSelector`, `DeleteSavedAccountProfileConfirmationModal` | active |
| `settings.general` | Settings general section | `SlidersHorizontal` | `SlidersHorizontalIcon` | `SettingsSidebar` | active |
| `settings.sessions` | Settings sessions section | `Layers` | `LayersIcon` | `SettingsSidebar` | active |
| `settings.system-state` | Settings system state section (SIP transport/register) | `Gauge` | — | `SettingsSidebar` (Phase 6) | planned |
| `settings.codecs` | Settings codecs section | `AudioLines` | `AudioLinesIcon` | `SettingsSidebar` | active |
| `settings.headset` | Settings headset section | `Headphones` | — | `SettingsSidebar` | active |
| `settings.nav.expand` | Expand settings sidebar | `ChevronRight` | `ChevronRightIcon` | `SettingsSidebar` | active |
| `settings.nav.collapse` | Collapse settings sidebar | `ChevronLeft` | `ChevronLeftIcon` | `SettingsSidebar` | active |
| `session.end` | End user session | `LogOut` | `LogoutIcon` | `UserAvatarMenu`, `LogoutActiveSessionConfirmationModal` | active |
| `sip.reregister` | Manual SIP re-register | `RefreshCcw` | `RefreshCcwIcon` | `SettingsSystemStatePanel` (Phase 6) | planned |
| `call.answer` | Answer ringing call | `PhoneCall` | `PhoneCallIcon` | `IncomingCallOverlay`, `CallLineRow` | active |
| `call.reject` | Reject incoming call | `PhoneOff` | `PhoneOffIcon` | `IncomingCallOverlay`, `CampaignEventModal` | active |
| `call.hangup` | Hang up active call | `PhoneOff` | `PhoneOffIcon` | `CallLineRow`, `ActiveCallControlsPanel` | active |
| `call.hold` | Hold call | `Pause` | `PauseIcon` | `CallLineRow`, `ActiveCallControlsPanel`, `MultiCallHoldAllIndicator` | active |
| `call.resume` | Resume held call | `Play` | `PlayIcon` | `CallLineRow`, `ActiveCallControlsPanel` | active |
| `call.mute` | Mute microphone | `MicOff` | `MicOffIcon` | `CallLineRow`, `ActiveCallControlsPanel` | active |
| `call.unmute` | Unmute microphone | `Mic` | `MicIcon` | `CallLineRow`, `ActiveCallControlsPanel` | active |
| `call.cameraOn` | Camera enabled | `Video` | — | `CallControlsBar` | active |
| `call.cameraOff` | Camera muted | `VideoOff` | — | `CallControlsBar` | active |
| `call.screenShare` | Start screen share | `MonitorUp` | — | `CallControlsBar` | active |
| `call.screenShareStop` | Stop screen share | `MonitorUp` | — | `CallControlsBar` | active |
| `call.videoExpand` | Expand video view | `Maximize2` | — | `CallControlsBar` | active |
| `call.videoCollapse` | Collapse video view from fullscreen | `Minimize2` | — | `CallControlsBar` | active |
| `call.transfer` | Start transfer | `PhoneForwarded` | `PhoneForwardedIcon` | `CallLineRow`, `TransferPanel` | active |
| `call.incoming` | Incoming call indicator | `PhoneIncoming` | `PhoneIncomingIcon` | `IncomingCallOverlay` | active |
| `call.outgoing` | Outgoing call indicator | `Phone` | `PhoneIcon` | `OutgoingCallCard` | active |
| `call.phone-off` | Connection lost | `PhoneOff` | `PhoneOffIcon` | `SettingsSystemStatePanel` (Phase 6) | planned |
| `overlay.close` | Close overlay/modal | `X` | `XIcon` | `ShellOverlaySheet`, modals, `OcpToastStack`, transfer cancel | active |
| `dial.call` | Place outgoing call | `PhoneOutgoing` | — | `Dialpad` | active |
| `dial.videoCall` | Place outgoing video call | `Video` | — | `Dialpad` | active |
| `dial.delete` | Delete last digit | `Delete` | `DeleteIcon` | `Dialpad` | active |
| `dial.clear` | Clear dialed number | `Eraser` | — | `Dialpad` | active |
| `operator.ready` | Agent ready status | `CircleCheck` | `CircleCheckIcon` | `StatusSelector` | active |
| `operator.break` | Agent break status | `Coffee` | `CoffeeIcon` | `StatusSelector` | active |
| `operator.logout` | Operator platform logout | `LogOut` | `LogoutIcon` | `StatusSelector`, `LogoutReasonModal` | active |
| `action.confirm` | Confirm action | `Check` | `CheckIcon` | `BreakReasonPicker`, `CampaignEventModal`, `TransferPanel` | active |
| `action.edit` | Edit contact or record | `Pencil` | — | `ContactDetailsPanel` | active |
| `action.retry` | Retry failed operation | `RotateCcw` | `RotateCcwIcon` | `CallLineRow`, `ActiveCallControlsPanel` | active |
| `transfer.consultation` | Start consultation call | `PhoneCall` | `PhoneCallIcon` | `TransferPanel` | active |
| `connection.retry` | Retry connection | `RotateCcw` | `RotateCcwIcon` | `SettingsSystemStatePanel` (Phase 6) | planned |
| `ui.select.chevron` | Expand select options | `ChevronDown` | — | `Select` | active |
| `phone.dnd.on` | DND mode active (bell on) | `Bell` | — | `UserAvatarMenu` | active |
| `phone.dnd.off` | DND mode inactive (bell off) | `BellOff` | — | `UserAvatarMenu` | active |
| `updates.available` | Update available prompt | `Download` | — | `UpdateAvailableBanner` | active |

## Adding an entry

```txt
1. Choose semantic id: <domain>.<action> (e.g. call.hold)
2. Check lucide-animated.com / package exports for animated variant
3. Add row here with usage path + status planned|active
4. Add to iconCatalog.ts (ICON_CATALOG)
5. Use <AppIcon id="..." /> in component
6. Set status active when merged
```

## Verification

```bash
npm run typecheck
npm run lint
```
