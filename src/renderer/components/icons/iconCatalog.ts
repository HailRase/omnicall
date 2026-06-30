import type { ComponentType, HTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AudioLines,
  Bell,
  BellOff,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Coffee,
  Delete,
  Eraser,
  Grid3x3,
  Headphones,
  Layers,
  LogOut,
  Mic,
  MicOff,
  Pause,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOff,
  PhoneOutgoing,
  Play,
  RefreshCcw,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import {
  ActivityIcon,
  AudioLinesIcon,
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
  | "settings.account"
  | "settings.general"
  | "settings.sessions"
  | "settings.codecs"
  | "settings.headset"
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
  | "call.transfer"
  | "call.incoming"
  | "call.outgoing"
  | "call.phone-off"
  | "overlay.close"
  | "dial.call"
  | "dial.delete"
  | "dial.clear"
  | "dial.dtmf"
  | "operator.ready"
  | "operator.break"
  | "operator.logout"
  | "action.confirm"
  | "action.retry"
  | "transfer.consultation"
  | "connection.retry"
  | "phone.dnd.on"
  | "phone.dnd.off";

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
    defaultLabel: "Настройки",
    defaultSize: 20,
    usage: ["UserAvatarMenu: user-menu-open-settings", "SettingsSidebar"],
  },
  "shell.diagnostics": {
    static: Activity,
    animated: ActivityIcon,
    defaultLabel: "Диагностика",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-diagnostics"],
  },
  "settings.account": {
    static: User,
    animated: UserIcon,
    defaultLabel: "Аккаунт",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-account"],
  },
  "settings.general": {
    static: SlidersHorizontal,
    animated: SlidersHorizontalIcon,
    defaultLabel: "Общее",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-general"],
  },
  "settings.sessions": {
    static: Layers,
    animated: LayersIcon,
    defaultLabel: "Сессии",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-sessions"],
  },
  "settings.codecs": {
    static: AudioLines,
    animated: AudioLinesIcon,
    defaultLabel: "Кодеки",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-codecs"],
  },
  "settings.headset": {
    static: Headphones,
    defaultLabel: "Гарнитура",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-nav-headset"],
  },
  "settings.nav.expand": {
    static: ChevronRight,
    animated: ChevronRightIcon,
    defaultLabel: "Развернуть меню",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-sidebar-expand"],
  },
  "settings.nav.collapse": {
    static: ChevronLeft,
    animated: ChevronLeftIcon,
    defaultLabel: "Свернуть меню",
    defaultSize: 20,
    usage: ["SettingsSidebar: settings-sidebar-collapse"],
  },
  "session.end": {
    static: LogOut,
    animated: LogoutIcon,
    defaultLabel: "Завершить сессию",
    defaultSize: 20,
    usage: [
      "UserAvatarMenu: user-menu-logout",
      "LogoutActiveSessionConfirmationModal",
      "ConnectionOverlay: control-safe-logout",
    ],
  },
  "sip.reregister": {
    static: RefreshCcw,
    animated: RefreshCcwIcon,
    defaultLabel: "Перерегистрация SIP",
    defaultSize: 20,
    usage: ["SoftphoneShellHeader: control-reregister-sip"],
  },
  "call.answer": {
    static: PhoneCall,
    animated: PhoneCallIcon,
    defaultLabel: "Ответить",
    defaultSize: 20,
    usage: ["IncomingCallOverlay", "IncomingCallSessionCard", "CallLineRow"],
  },
  "call.reject": {
    static: PhoneOff,
    animated: PhoneOffIcon,
    defaultLabel: "Отклонить",
    defaultSize: 20,
    usage: ["IncomingCallOverlay", "IncomingCallSessionCard", "CampaignEventModal"],
  },
  "call.hangup": {
    static: PhoneOff,
    animated: PhoneOffIcon,
    defaultLabel: "Завершить звонок",
    defaultSize: 20,
    usage: ["CallLineRow", "ActiveCallControlsPanel"],
  },
  "call.hold": {
    static: Pause,
    animated: PauseIcon,
    defaultLabel: "Удержание",
    defaultSize: 20,
    usage: ["CallLineRow", "ActiveCallControlsPanel", "MultiCallHoldAllIndicator"],
  },
  "call.resume": {
    static: Play,
    animated: PlayIcon,
    defaultLabel: "Возобновить",
    defaultSize: 20,
    usage: ["CallLineRow", "ActiveCallControlsPanel"],
  },
  "call.mute": {
    static: MicOff,
    animated: MicOffIcon,
    defaultLabel: "Отключить микрофон",
    defaultSize: 20,
    usage: ["CallLineRow", "ActiveCallControlsPanel"],
  },
  "call.unmute": {
    static: Mic,
    animated: MicIcon,
    defaultLabel: "Включить микрофон",
    defaultSize: 20,
    usage: ["CallLineRow", "ActiveCallControlsPanel"],
  },
  "call.transfer": {
    static: PhoneForwarded,
    animated: PhoneForwardedIcon,
    defaultLabel: "Перевод",
    defaultSize: 20,
    usage: ["CallLineRow", "TransferPanel", "TransferPanel: control-blind-transfer"],
  },
  "call.incoming": {
    static: PhoneIncoming,
    animated: PhoneIncomingIcon,
    defaultLabel: "Входящий звонок",
    defaultSize: 20,
    usage: ["IncomingCallOverlay", "IncomingCallSessionCard"],
  },
  "call.outgoing": {
    static: Phone,
    animated: PhoneIcon,
    defaultLabel: "Исходящий звонок",
    defaultSize: 20,
    usage: ["OutgoingCallCard"],
  },
  "call.phone-off": {
    static: PhoneOff,
    animated: PhoneOffIcon,
    defaultLabel: "Телефон недоступен",
    defaultSize: 20,
    usage: ["ConnectionOverlay"],
  },
  "overlay.close": {
    static: X,
    animated: XIcon,
    defaultLabel: "Закрыть",
    defaultSize: 20,
    usage: [
      "ShellOverlaySheet",
      "CampaignEventModal",
      "LogoutReasonModal",
      "LogoutActiveSessionConfirmationModal",
      "TransferPanel: control-cancel-transfer",
      "OcpToastStack",
    ],
  },
  "dial.call": {
    static: PhoneOutgoing,
    defaultLabel: "Позвонить",
    defaultSize: 20,
    usage: ["Dialpad: dialpad-call"],
  },
  "dial.delete": {
    static: Delete,
    animated: DeleteIcon,
    defaultLabel: "Удалить цифру",
    defaultSize: 20,
    usage: ["Dialpad: dialpad-delete"],
  },
  "dial.clear": {
    static: Eraser,
    defaultLabel: "Очистить номер",
    defaultSize: 20,
    usage: ["Dialpad: dialpad-clear"],
  },
  "dial.dtmf": {
    static: Grid3x3,
    defaultLabel: "Тоновый набор",
    defaultSize: 20,
    usage: ["CallControlsBar: control-show-dtmf"],
  },
  "operator.ready": {
    static: CircleCheck,
    animated: CircleCheckIcon,
    defaultLabel: "Готов",
    defaultSize: 20,
    usage: ["StatusSelector: control-change-ready"],
  },
  "operator.break": {
    static: Coffee,
    animated: CoffeeIcon,
    defaultLabel: "Перерыв",
    defaultSize: 20,
    usage: ["StatusSelector: control-change-break"],
  },
  "operator.logout": {
    static: LogOut,
    animated: LogoutIcon,
    defaultLabel: "Выход",
    defaultSize: 20,
    usage: ["StatusSelector: control-request-logout", "LogoutReasonModal"],
  },
  "action.confirm": {
    static: Check,
    animated: CheckIcon,
    defaultLabel: "Подтвердить",
    defaultSize: 20,
    usage: [
      "BreakReasonPicker: control-confirm-break",
      "CampaignEventModal: campaign-accept",
      "TransferPanel: control-attended-transfer",
    ],
  },
  "action.retry": {
    static: RotateCcw,
    animated: RotateCcwIcon,
    defaultLabel: "Повторить",
    defaultSize: 20,
    usage: [
      "ConnectionOverlay: control-retry-connection",
      "ActiveCallControlsPanel: control-retry",
      "CallLineRow: control-retry-line",
    ],
  },
  "transfer.consultation": {
    static: PhoneCall,
    animated: PhoneCallIcon,
    defaultLabel: "Начать консультацию",
    defaultSize: 20,
    usage: ["TransferPanel: control-start-consultation"],
  },
  "connection.retry": {
    static: RotateCcw,
    animated: RotateCcwIcon,
    defaultLabel: "Повторить подключение",
    defaultSize: 20,
    usage: ["ConnectionOverlay: control-retry-connection"],
  },
  "phone.dnd.on": {
    static: Bell,
    defaultLabel: "Не беспокоить включено",
    defaultSize: 20,
    usage: ["UserAvatarMenu: user-menu-toggle-dnd dndEnabled=true"],
  },
  "phone.dnd.off": {
    static: BellOff,
    defaultLabel: "Не беспокоить выключено",
    defaultSize: 20,
    usage: ["UserAvatarMenu: user-menu-toggle-dnd dndEnabled=false"],
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
  return fallback ?? ICON_CATALOG[id].defaultLabel;
}
