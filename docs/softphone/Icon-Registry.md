# Icon Registry

**F-016** UI icon semantics. Agents: read `Icon-Agent-Guide.md` before UI work.

## Rules

1. One **semantic id** per distinct UI meaning (not per Lucide glyph).
2. Prefer `lucide-animated` when `animated` column is set; else `lucide-react`.
3. Update this table **and** `iconCatalog.ts` in the same change.
4. Icon-only buttons: `aria-label` on button; icon decorative. Tooltips: deferred WU.

## Registry

| Semantic ID | Purpose | Static | Animated | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| `shell.settings` | Open settings overlay | `Settings` | `SettingsIcon` | `SoftphoneShellHeader` → `control-open-settings` | planned |
| `shell.diagnostics` | Open diagnostics overlay | `Activity` | `ActivityIcon` | `SoftphoneShellHeader` → `control-open-diagnostics` | planned |
| `shell.collapse` | Collapse shell strip | `PanelLeftClose` | `PanelLeftCloseIcon` | `SoftphoneShellHeader` → `control-toggle-collapse` | planned |
| `shell.expand` | Expand shell | `PanelLeftOpen` | `PanelLeftOpenIcon` | `SoftphoneShellHeader` → `control-toggle-collapse` | planned |
| `session.end` | End user session | `LogOut` | `LogoutIcon` | `SoftphoneShellHeader` → `control-end-session` | planned |
| `sip.reregister` | Manual SIP re-register | `RefreshCcw` | `RefreshCcwIcon` | `SoftphoneShellHeader` → `control-reregister-sip` | planned |
| `call.answer` | Answer ringing call | `PhoneCall` | `PhoneCallIcon` | `IncomingCallActions`, `CallLineRow` | planned |
| `call.reject` | Reject incoming call | `PhoneOff` | `PhoneOffIcon` | `IncomingCallActions` | planned |
| `call.hangup` | Hang up active call | `PhoneOff` | `PhoneOffIcon` | `CallLineRow`, `ActiveCallControlsPanel` | planned |
| `call.hold` | Hold call | `Pause` | `PauseIcon` | `CallLineRow`, `ActiveCallControlsPanel` | planned |
| `call.resume` | Resume held call | `Play` | `PlayIcon` | `CallLineRow`, `ActiveCallControlsPanel` | planned |
| `call.mute` | Mute microphone | `MicOff` | `MicOffIcon` | `CallLineRow`, `ActiveCallControlsPanel` | planned |
| `call.unmute` | Unmute microphone | `Mic` | `MicIcon` | `CallLineRow`, `ActiveCallControlsPanel` | planned |
| `call.transfer` | Start transfer | `PhoneForwarded` | `PhoneForwardedIcon` | `CallLineRow`, `TransferPanel` | planned |
| `call.incoming` | Incoming call indicator | `PhoneIncoming` | `PhoneIncomingIcon` | `IncomingCallModal` | planned |
| `call.outgoing` | Outgoing call indicator | `Phone` | `PhoneIcon` | `OutgoingCallCard` | planned |
| `call.phone-off` | Connection lost | `PhoneOff` | `PhoneOffIcon` | `ConnectionOverlay` | planned |
| `overlay.close` | Close overlay/modal | `X` | `XIcon` | `ShellOverlaySheet`, modals | planned |

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
