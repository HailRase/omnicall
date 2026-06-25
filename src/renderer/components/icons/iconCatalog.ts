import type { ComponentType, HTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Check,
  CircleCheck,
  Coffee,
  Delete,
  Eraser,
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
  PhoneOutgoing,
  Play,
  RefreshCcw,
  RotateCcw,
  Settings,
  X,
} from "lucide-react";
import {
  ActivityIcon,
  CheckIcon,
  CircleCheckIcon,
  CoffeeIcon,
  DeleteIcon,
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
  RotateCcwIcon,
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
  | "overlay.close"
  | "dial.call"
  | "dial.delete"
  | "dial.clear"
  | "operator.ready"
  | "operator.break"
  | "operator.logout"
  | "action.confirm"
  | "action.retry"
  | "transfer.consultation"
  | "connection.retry";

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
    usage: ["SoftphoneShellHeader: control-open-settings", "SettingsOverlay"],
  },
  "shell.diagnostics": {
    static: Activity,
    animated: ActivityIcon,
    defaultLabel: "Диагностика",
    defaultSize: 20,
    usage: ["SoftphoneShellHeader: control-open-diagnostics"],
  },
  "shell.collapse": {
    static: PanelLeftClose,
    animated: PanelLeftCloseIcon,
    defaultLabel: "Свернуть софтфон",
    defaultSize: 20,
    usage: ["SoftphoneShellHeader: control-toggle-collapse collapsed=false"],
  },
  "shell.expand": {
    static: PanelLeftOpen,
    animated: PanelLeftOpenIcon,
    defaultLabel: "Развернуть софтфон",
    defaultSize: 20,
    usage: ["SoftphoneShellHeader: control-toggle-collapse collapsed=true"],
  },
  "session.end": {
    static: LogOut,
    animated: LogoutIcon,
    defaultLabel: "Завершить сессию",
    defaultSize: 20,
    usage: [
      "SoftphoneShellHeader: control-end-session",
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
    usage: ["IncomingCallActions", "CallLineRow"],
  },
  "call.reject": {
    static: PhoneOff,
    animated: PhoneOffIcon,
    defaultLabel: "Отклонить",
    defaultSize: 20,
    usage: ["IncomingCallActions", "CampaignEventModal"],
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
    usage: ["IncomingCallModal"],
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
