import type { ComponentType, HTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { translateCurrent, type TranslationKey } from "../../i18n/index.js";
import {
  Activity,
  AudioLines,
  Bell,
  BellOff,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Coffee,
  Delete,
  Download,
  Eraser,
  Eye,
  EyeOff,
  Gauge,
  Grid3x3,
  Headphones,
  Layers,
  LogOut,
  Mic,
  MicOff,
  Minus,
  Pause,
  PanelLeft,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOff,
  PhoneOutgoing,
  Pencil,
  Play,
  RefreshCcw,
  RotateCcw,
  Server,
  Settings,
  SlidersHorizontal,
  Trash2,
  User,
  UserRoundPlus,
  Users,
  Video,
  VideoOff,
  MonitorUp,
  Maximize2,
  Minimize2,
  Plug,
  X,
} from "lucide-react";
import {
  ActivityIcon,
  AudioLinesIcon,
  BellIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CoffeeIcon,
  DeleteIcon,
  LayersIcon,
  LogoutIcon,
  MicIcon,
  MicOffIcon,
  PauseIcon,
  PhoneCallIcon,
  PhoneForwardedIcon,
  PhoneIcon,
  PhoneIncomingIcon,
  PhoneOffIcon,
  PlayIcon,
  RefreshCcwIcon,
  RotateCcwIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  UserIcon,
  XIcon,
} from "lucide-animated";

export type AnimatedIconComponent = ComponentType<
  HTMLAttributes<HTMLDivElement> & Readonly<{ size?: number; animateOnHover?: boolean }>
>;

export type IconSemanticId =
  | "shell.settings"
  | "shell.diagnostics"
  | "shell.restart"
  | "shell.window.minimize"
  | "shell.window.close"
  | "shell.nav.back"
  | "shell.contacts"
  | "contact.add"
  | "form.password.show"
  | "form.password.hide"
  | "settings.account"
  | "account.profile.delete"
  | "settings.general"
  | "settings.sessions"
  | "settings.system-state"
  | "settings.codecs"
  | "settings.video"
  | "settings.headset"
  | "settings.integrations"
  | "settings.integrations.ocp"
  | "settings.notifications"
  | "settings.nav.expand"
  | "settings.nav.collapse"
  | "session.end"
  | "sip.reregister"
  | "call.answer"
  | "call.reject"
  | "call.hangup"
  | "call.hold"
  | "call.resume"
  | "call.mute"
  | "call.unmute"
  | "call.cameraOn"
  | "call.cameraOff"
  | "call.screenShare"
  | "call.screenShareStop"
  | "call.videoExpand"
  | "call.videoCollapse"
  | "call.videoHidden"
  | "call.transfer"
  | "call.incoming"
  | "call.outgoing"
  | "call.phone-off"
  | "overlay.close"
  | "dial.call"
  | "dial.videoCall"
  | "dial.delete"
  | "dial.clear"
  | "dial.dtmf"
  | "operator.ready"
  | "operator.break"
  | "operator.logout"
  | "action.confirm"
  | "action.edit"
  | "action.retry"
  | "transfer.consultation"
  | "connection.retry"
  | "ui.select.chevron"
  | "ui.sidebar.toggle"
  | "phone.dnd.on"
  | "phone.dnd.off"
  | "updates.available"
  | "notification.success"
  | "notification.error";

export type IconCatalogEntry = Readonly<{
  static: LucideIcon;
  animated?: AnimatedIconComponent;
  defaultLabelKey: TranslationKey;
  defaultSize: number;
  usage: ReadonlyArray<string>;
}>;

export const ICON_CATALOG: Record<IconSemanticId, IconCatalogEntry> = {
  "shell.settings": {
    static: Settings,
    animated: SettingsIcon,
    defaultLabelKey: "icons.shell.settings",
    defaultSize: 20,
    usage: ["UserAvatarMenu: user-menu-open-settings", "SettingsSidebar"],
  },
  "shell.diagnostics": {
    static: Activity,
    animated: ActivityIcon,
    defaultLabelKey: "icons.shell.diagnostics",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-diagnostics"],
  },
  "shell.restart": {
    static: RotateCcw,
    animated: RotateCcwIcon,
    defaultLabelKey: "icons.shell.restart",
    defaultSize: 16,
    usage: ["ShellWindowControls: control-window-restart"],
  },
  "shell.window.minimize": {
    static: Minus,
    defaultLabelKey: "icons.shell.window.minimize",
    defaultSize: 16,
    usage: ["ShellWindowControls: control-window-minimize"],
  },
  "shell.window.close": {
    static: X,
    defaultLabelKey: "icons.shell.window.close",
    defaultSize: 16,
    usage: ["ShellWindowControls: control-window-close"],
  },
  "shell.nav.back": {
    static: ChevronLeft,
    animated: ChevronLeftIcon,
    defaultLabelKey: "icons.shell.nav.back",
    defaultSize: 18,
    usage: ["ShellDialpadPanel: panel-back"],
  },
  "shell.contacts": {
    static: Users,
    defaultLabelKey: "icons.shell.contacts",
    defaultSize: 18,
    usage: ["ContactsListPanel: contacts-empty", "Dialpad: dialpad-contacts"],
  },
  "contact.add": {
    static: UserRoundPlus,
    defaultLabelKey: "icons.contact.add",
    defaultSize: 16,
    usage: ["ContactsListPanel: contacts-add", "ContactsListPanel: contacts-add-empty"],
  },
  "form.password.show": {
    static: Eye,
    defaultLabelKey: "icons.form.password.show",
    defaultSize: 16,
    usage: ["AccountPanel: account-password-visibility-toggle"],
  },
  "form.password.hide": {
    static: EyeOff,
    defaultLabelKey: "icons.form.password.hide",
    defaultSize: 16,
    usage: ["AccountPanel: account-password-visibility-toggle"],
  },
  "settings.account": {
    static: User,
    animated: UserIcon,
    defaultLabelKey: "icons.settings.account",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-account"],
  },
  "account.profile.delete": {
    static: Trash2,
    defaultLabelKey: "icons.account.profile.delete",
    defaultSize: 20,
    usage: [
      "SavedAccountProfileSelector: saved-account-profile-tab-delete",
      "DeleteSavedAccountProfileConfirmationModal",
    ],
  },
  "settings.general": {
    static: SlidersHorizontal,
    animated: SlidersHorizontalIcon,
    defaultLabelKey: "icons.settings.general",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-general"],
  },
  "settings.sessions": {
    static: Layers,
    animated: LayersIcon,
    defaultLabelKey: "icons.settings.sessions",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-sessions"],
  },
  "settings.system-state": {
    static: Gauge,
    defaultLabelKey: "settings.nav.systemState",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-system-state (Phase 6)"],
  },
  "settings.codecs": {
    static: AudioLines,
    animated: AudioLinesIcon,
    defaultLabelKey: "icons.settings.codecs",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-codecs"],
  },
  "settings.video": {
    static: Video,
    defaultLabelKey: "icons.settings.video",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-video"],
  },
  "settings.headset": {
    static: Headphones,
    defaultLabelKey: "icons.settings.headset",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-headset"],
  },
  "settings.integrations": {
    static: Plug,
    defaultLabelKey: "icons.settings.integrations",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-integrations"],
  },
  "settings.integrations.ocp": {
    static: Server,
    defaultLabelKey: "icons.settings.integrations.ocp",
    defaultSize: 18,
    usage: ["SettingsSidebar: settings-nav-integrations-ocp"],
  },
  "settings.notifications": {
    static: Bell,
    animated: BellIcon,
    defaultLabelKey: "icons.settings.notifications",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-notifications"],
  },
  "settings.nav.expand": {
    static: ChevronRight,
    animated: ChevronRightIcon,
    defaultLabelKey: "icons.settings.nav.expand",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-sidebar-expand"],
  },
  "settings.nav.collapse": {
    static: ChevronLeft,
    animated: ChevronLeftIcon,
    defaultLabelKey: "icons.settings.nav.collapse",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-sidebar-collapse"],
  },
  "session.end": {
    static: LogOut,
    animated: LogoutIcon,
    defaultLabelKey: "icons.session.end",
    defaultSize: 20,
    usage: [
      "UserAvatarMenu: user-menu-logout",
      "LogoutActiveSessionConfirmationModal",
    ],
  },
  "sip.reregister": {
    static: RefreshCcw,
    animated: RefreshCcwIcon,
    defaultLabelKey: "icons.sip.reregister",
    defaultSize: 20,
    usage: ["SettingsSystemStatePanel: control-reregister-sip (Phase 6)"],
  },
  "call.answer": {
    static: PhoneCall,
    animated: PhoneCallIcon,
    defaultLabelKey: "icons.call.answer",
    defaultSize: 20,
    usage: ["IncomingCallOverlay", "IncomingCallSessionCard", "CallLineRow"],
  },
  "call.reject": {
    static: PhoneOff,
    animated: PhoneOffIcon,
    defaultLabelKey: "icons.call.reject",
    defaultSize: 20,
    usage: ["IncomingCallOverlay", "IncomingCallSessionCard"],
  },
  "call.hangup": {
    static: Phone,
    animated: PhoneIcon,
    defaultLabelKey: "icons.call.hangup",
    defaultSize: 20,
    usage: [
      "CallLineRow",
      "ActiveCallControlsPanel",
      "CallControlsBar",
      "VideoFullscreenControlsBar",
    ],
  },
  "call.hold": {
    static: Pause,
    animated: PauseIcon,
    defaultLabelKey: "icons.call.hold",
    defaultSize: 20,
    usage: ["CallLineRow", "ActiveCallControlsPanel", "MultiCallHoldAllIndicator"],
  },
  "call.resume": {
    static: Play,
    animated: PlayIcon,
    defaultLabelKey: "icons.call.resume",
    defaultSize: 20,
    usage: ["CallLineRow", "ActiveCallControlsPanel"],
  },
  "call.mute": {
    static: MicOff,
    animated: MicOffIcon,
    defaultLabelKey: "icons.call.mute",
    defaultSize: 20,
    usage: ["CallLineRow", "ActiveCallControlsPanel"],
  },
  "call.unmute": {
    static: Mic,
    animated: MicIcon,
    defaultLabelKey: "icons.call.unmute",
    defaultSize: 20,
    usage: ["CallLineRow", "ActiveCallControlsPanel"],
  },
  "call.cameraOn": {
    static: Video,
    defaultLabelKey: "icons.call.cameraOn",
    defaultSize: 20,
    usage: ["CallControlsBar: control-camera"],
  },
  "call.cameraOff": {
    static: VideoOff,
    defaultLabelKey: "icons.call.cameraOff",
    defaultSize: 20,
    usage: ["CallControlsBar: control-camera"],
  },
  "call.screenShare": {
    static: MonitorUp,
    defaultLabelKey: "icons.call.screenShare",
    defaultSize: 20,
    usage: ["CallControlsBar: control-screen-share"],
  },
  "call.screenShareStop": {
    static: MonitorUp,
    defaultLabelKey: "icons.call.screenShareStop",
    defaultSize: 20,
    usage: ["CallControlsBar: control-screen-share"],
  },
  "call.videoExpand": {
    static: Maximize2,
    defaultLabelKey: "icons.call.videoExpand",
    defaultSize: 20,
    usage: ["CallControlsBar: control-video-expand"],
  },
  "call.videoCollapse": {
    static: Minimize2,
    defaultLabelKey: "icons.call.videoCollapse",
    defaultSize: 20,
    usage: ["CallControlsBar: control-video-expand (collapse from fullscreen)"],
  },
  "call.videoHidden": {
    static: EyeOff,
    defaultLabelKey: "icons.call.videoHidden",
    defaultSize: 20,
    usage: ["VideoFullscreenControlsBar: view-mode-hidden"],
  },
  "call.transfer": {
    static: PhoneForwarded,
    animated: PhoneForwardedIcon,
    defaultLabelKey: "icons.call.transfer",
    defaultSize: 20,
    usage: ["CallLineRow", "TransferPanel", "TransferPanel: control-blind-transfer"],
  },
  "call.incoming": {
    static: PhoneIncoming,
    animated: PhoneIncomingIcon,
    defaultLabelKey: "icons.call.incoming",
    defaultSize: 20,
    usage: ["IncomingCallOverlay", "IncomingCallSessionCard"],
  },
  "call.outgoing": {
    static: Phone,
    animated: PhoneIcon,
    defaultLabelKey: "icons.call.outgoing",
    defaultSize: 20,
    usage: ["OutgoingCallCard"],
  },
  "call.phone-off": {
    static: PhoneOff,
    animated: PhoneOffIcon,
    defaultLabelKey: "icons.call.phoneOff",
    defaultSize: 20,
    usage: ["SettingsSystemStatePanel (Phase 6)"],
  },
  "overlay.close": {
    static: X,
    animated: XIcon,
    defaultLabelKey: "icons.overlay.close",
    defaultSize: 20,
    usage: [
      "ShellOverlaySheet",
      "LogoutActiveSessionConfirmationModal",
      "TransferPanel: control-cancel-transfer",
      "UpdateAvailableBanner: update-available-banner-later",
      "VideoFullscreenModal",
    ],
  },
  "dial.call": {
    static: PhoneOutgoing,
    defaultLabelKey: "icons.dial.call",
    defaultSize: 20,
    usage: ["Dialpad: dialpad-call"],
  },
  "dial.videoCall": {
    static: Video,
    defaultLabelKey: "icons.dial.videoCall",
    defaultSize: 20,
    usage: ["Dialpad: dialpad-video-call"],
  },
  "dial.delete": {
    static: Delete,
    animated: DeleteIcon,
    defaultLabelKey: "icons.dial.delete",
    defaultSize: 20,
    usage: ["Dialpad: dialpad-delete"],
  },
  "dial.clear": {
    static: Eraser,
    defaultLabelKey: "icons.dial.clear",
    defaultSize: 20,
    usage: ["Dialpad: dialpad-clear"],
  },
  "dial.dtmf": {
    static: Grid3x3,
    defaultLabelKey: "icons.dial.dtmf",
    defaultSize: 20,
    usage: ["CallControlsBar: control-show-dtmf"],
  },
  "operator.ready": {
    static: CircleCheck,
    animated: CircleCheckIcon,
    defaultLabelKey: "icons.operator.ready",
    defaultSize: 20,
    usage: ["Badge.stories: operator status tones"],
  },
  "operator.break": {
    static: Coffee,
    animated: CoffeeIcon,
    defaultLabelKey: "icons.operator.break",
    defaultSize: 20,
    usage: ["Badge.stories: operator status tones"],
  },
  "operator.logout": {
    static: LogOut,
    animated: LogoutIcon,
    defaultLabelKey: "icons.operator.logout",
    defaultSize: 20,
    usage: ["Badge.stories: operator status tones"],
  },
  "action.confirm": {
    static: Check,
    animated: CheckIcon,
    defaultLabelKey: "icons.action.confirm",
    defaultSize: 20,
    usage: ["TransferPanel: control-attended-transfer"],
  },
  "action.edit": {
    static: Pencil,
    defaultLabelKey: "icons.action.edit",
    defaultSize: 16,
    usage: ["ContactDetailsPanel: contacts-edit"],
  },
  "action.retry": {
    static: RotateCcw,
    animated: RotateCcwIcon,
    defaultLabelKey: "icons.action.retry",
    defaultSize: 20,
    usage: [
      "ActiveCallControlsPanel: control-retry",
      "CallLineRow: control-retry-line",
    ],
  },
  "transfer.consultation": {
    static: PhoneCall,
    animated: PhoneCallIcon,
    defaultLabelKey: "icons.transfer.consultation",
    defaultSize: 20,
    usage: ["TransferPanel: control-start-consultation"],
  },
  "connection.retry": {
    static: RotateCcw,
    animated: RotateCcwIcon,
    defaultLabelKey: "icons.connection.retry",
    defaultSize: 20,
    usage: ["SettingsSystemStatePanel: control-retry-transport (Phase 6)"],
  },
  "ui.select.chevron": {
    static: ChevronDown,
    defaultLabelKey: "icons.ui.select.chevron",
    defaultSize: 16,
    usage: [
      "Select: select-trigger-chevron",
      "OverwriteSavedAccountCredentialsConfirmationModal: more-actions",
    ],
  },
  "ui.sidebar.toggle": {
    static: PanelLeft,
    defaultLabelKey: "icons.ui.sidebar.toggle",
    defaultSize: 16,
    usage: ["Sidebar: SidebarTrigger"],
  },
  "phone.dnd.on": {
    static: Bell,
    defaultLabelKey: "icons.phone.dnd.on",
    defaultSize: 20,
    usage: ["UserAvatarMenu: user-menu-toggle-dnd dndEnabled=true"],
  },
  "phone.dnd.off": {
    static: BellOff,
    defaultLabelKey: "icons.phone.dnd.off",
    defaultSize: 20,
    usage: ["UserAvatarMenu: user-menu-toggle-dnd dndEnabled=false"],
  },
  "updates.available": {
    static: Download,
    defaultLabelKey: "icons.updates.available",
    defaultSize: 20,
    usage: ["UpdateAvailableBanner"],
  },
  "notification.success": {
    static: CircleCheck,
    defaultLabelKey: "icons.action.confirm",
    defaultSize: 16,
    usage: ["NotificationViewport: success toast icon"],
  },
  "notification.error": {
    static: CircleX,
    defaultLabelKey: "icons.overlay.close",
    defaultSize: 16,
    usage: ["NotificationViewport: error toast icon"],
  },
};

export function resolveIconEntry(id: IconSemanticId): IconCatalogEntry {
  return ICON_CATALOG[id];
}

/**
 * - Purpose: pick tooltip copy for icon-only controls.
 * - Inputs: semantic id, optional disabled reason, optional override label.
 * - Outputs: disabled reason when set, else override or catalog defaultLabel.
 */
export function resolveIconTooltipLabel(
  id: IconSemanticId,
  disabledReason?: string | null,
  fallback?: string,
): string {
  if (disabledReason !== undefined && disabledReason !== null && disabledReason.length > 0) {
    return disabledReason;
  }
  return fallback ?? translateCurrent(ICON_CATALOG[id].defaultLabelKey);
}

export function resolveIconDefaultLabel(id: IconSemanticId): string {
  return translateCurrent(ICON_CATALOG[id].defaultLabelKey);
}
