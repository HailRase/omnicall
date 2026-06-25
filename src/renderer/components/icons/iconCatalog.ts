import type { ComponentType, HTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  LogOut,
  Mic,
  MicOff,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOff,
  Play,
  RefreshCcw,
  Settings,
  X,
} from "lucide-react";
import {
  ActivityIcon,
  LogoutIcon,
  MicIcon,
  MicOffIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PauseIcon,
  PhoneCallIcon,
  PhoneForwardedIcon,
  PhoneIcon,
  PhoneIncomingIcon,
  PhoneOffIcon,
  PlayIcon,
  RefreshCcwIcon,
  SettingsIcon,
  XIcon,
} from "lucide-animated";

export type AnimatedIconComponent = ComponentType<
  HTMLAttributes<HTMLDivElement> & Readonly<{ size?: number; animateOnHover?: boolean }>
>;

export type IconSemanticId =
  | "shell.settings"
  | "shell.diagnostics"
  | "shell.collapse"
  | "shell.expand"
  | "session.end"
  | "sip.reregister"
  | "call.answer"
  | "call.reject"
  | "call.hangup"
  | "call.hold"
  | "call.resume"
  | "call.mute"
  | "call.unmute"
  | "call.transfer"
  | "call.incoming"
  | "call.outgoing"
  | "call.phone-off"
  | "overlay.close";

export type IconCatalogEntry = Readonly<{
  static: LucideIcon;
  animated?: AnimatedIconComponent;
  defaultLabel: string;
  defaultSize: number;
  usage: ReadonlyArray<string>;
}>;

export const ICON_CATALOG: Record<IconSemanticId, IconCatalogEntry> = {
  "shell.settings": {
    static: Settings,
    animated: SettingsIcon,
    defaultLabel: "Settings",
    defaultSize: 20,
    usage: ["SoftphoneShellHeader: control-open-settings (planned)"],
  },
  "shell.diagnostics": {
    static: Activity,
    animated: ActivityIcon,
    defaultLabel: "Diagnostics",
    defaultSize: 20,
    usage: ["SoftphoneShellHeader: control-open-diagnostics (planned)"],
  },
  "shell.collapse": {
    static: PanelLeftClose,
    animated: PanelLeftCloseIcon,
    defaultLabel: "Collapse softphone",
    defaultSize: 20,
    usage: ["SoftphoneShellHeader: control-toggle-collapse collapsed=false (planned)"],
  },
  "shell.expand": {
    static: PanelLeftOpen,
    animated: PanelLeftOpenIcon,
    defaultLabel: "Expand softphone",
    defaultSize: 20,
    usage: ["SoftphoneShellHeader: control-toggle-collapse collapsed=true (planned)"],
  },
  "session.end": {
    static: LogOut,
    animated: LogoutIcon,
    defaultLabel: "End session",
    defaultSize: 20,
    usage: ["SoftphoneShellHeader: control-end-session (planned)"],
  },
  "sip.reregister": {
    static: RefreshCcw,
    animated: RefreshCcwIcon,
    defaultLabel: "Re-register SIP",
    defaultSize: 20,
    usage: ["SoftphoneShellHeader: control-reregister-sip (planned)"],
  },
  "call.answer": {
    static: PhoneCall,
    animated: PhoneCallIcon,
    defaultLabel: "Answer",
    defaultSize: 20,
    usage: ["IncomingCallActions (planned)", "CallLineRow (planned)"],
  },
  "call.reject": {
    static: PhoneOff,
    animated: PhoneOffIcon,
    defaultLabel: "Reject",
    defaultSize: 20,
    usage: ["IncomingCallActions (planned)"],
  },
  "call.hangup": {
    static: PhoneOff,
    animated: PhoneOffIcon,
    defaultLabel: "Hang up",
    defaultSize: 20,
    usage: ["CallLineRow (planned)", "ActiveCallControlsPanel (planned)"],
  },
  "call.hold": {
    static: Pause,
    animated: PauseIcon,
    defaultLabel: "Hold",
    defaultSize: 20,
    usage: ["CallLineRow (planned)", "ActiveCallControlsPanel (planned)"],
  },
  "call.resume": {
    static: Play,
    animated: PlayIcon,
    defaultLabel: "Resume",
    defaultSize: 20,
    usage: ["CallLineRow (planned)", "ActiveCallControlsPanel (planned)"],
  },
  "call.mute": {
    static: MicOff,
    animated: MicOffIcon,
    defaultLabel: "Mute",
    defaultSize: 20,
    usage: ["CallLineRow (planned)", "ActiveCallControlsPanel (planned)"],
  },
  "call.unmute": {
    static: Mic,
    animated: MicIcon,
    defaultLabel: "Unmute",
    defaultSize: 20,
    usage: ["CallLineRow (planned)", "ActiveCallControlsPanel (planned)"],
  },
  "call.transfer": {
    static: PhoneForwarded,
    animated: PhoneForwardedIcon,
    defaultLabel: "Transfer",
    defaultSize: 20,
    usage: ["CallLineRow (planned)", "TransferPanel (planned)"],
  },
  "call.incoming": {
    static: PhoneIncoming,
    animated: PhoneIncomingIcon,
    defaultLabel: "Incoming call",
    defaultSize: 20,
    usage: ["IncomingCallModal (planned)"],
  },
  "call.outgoing": {
    static: Phone,
    animated: PhoneIcon,
    defaultLabel: "Outgoing call",
    defaultSize: 20,
    usage: ["OutgoingCallCard (planned)"],
  },
  "call.phone-off": {
    static: PhoneOff,
    animated: PhoneOffIcon,
    defaultLabel: "Phone unavailable",
    defaultSize: 20,
    usage: ["ConnectionOverlay (planned)"],
  },
  "overlay.close": {
    static: X,
    animated: XIcon,
    defaultLabel: "Close",
    defaultSize: 20,
    usage: ["ShellOverlaySheet (planned)", "modals (planned)"],
  },
};

export function resolveIconEntry(id: IconSemanticId): IconCatalogEntry {
  return ICON_CATALOG[id];
}
