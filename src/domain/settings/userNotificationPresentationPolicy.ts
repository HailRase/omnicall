import type {
  UserNotificationLevel,
  UserNotificationModule,
} from "./UserNotificationJournalEntry.js";
import type { UserNotificationPreferences } from "./userNotificationPreferencesTypes.js";
import { USER_NOTIFICATION_LEVEL_RANK } from "./userNotificationPreferencesTypes.js";

export const NOTIFICATION_INTERRUPT_CLASSES = [
  "critical",
  "actionable",
  "informational",
  "remote",
] as const;

export type NotificationInterruptClass =
  (typeof NOTIFICATION_INTERRUPT_CLASSES)[number];

export const NOTIFICATION_SUPPRESS_REASONS = [
  "master_popup_disabled",
  "module_disabled",
  "below_min_level",
  "interrupt_not_toast",
  "raise_not_enabled",
  "raise_level_too_low",
  "raise_interrupt_denied",
] as const;

export type NotificationSuppressReason =
  (typeof NOTIFICATION_SUPPRESS_REASONS)[number];

export type PresentationPolicyInput = Readonly<{
  level: UserNotificationLevel;
  module: UserNotificationModule;
  interruptClass: NotificationInterruptClass;
  preferences: UserNotificationPreferences;
}>;

export type PresentationPolicyDecision = Readonly<{
  shouldPresentPopup: boolean;
  shouldRaiseWindow: boolean;
  suppressReasons: ReadonlyArray<NotificationSuppressReason>;
}>;

/**
 * - Purpose: pure in-app popup / optional raise decision from preferences.
 * - Inputs: level, module, interruptClass, active preferences.
 * - Outputs: present/raise flags and structured suppress reasons.
 */
export function evaluateNotificationPresentationPolicy(
  input: PresentationPolicyInput,
): PresentationPolicyDecision {
  const suppressReasons: NotificationSuppressReason[] = [];
  const shouldPresentPopup = evaluatePopupPresentation(input, suppressReasons);
  const shouldRaiseWindow = evaluateRaiseWindow(input, suppressReasons);
  return {
    shouldPresentPopup,
    shouldRaiseWindow,
    suppressReasons,
  };
}

function evaluatePopupPresentation(
  input: PresentationPolicyInput,
  suppressReasons: NotificationSuppressReason[],
): boolean {
  let present = true;
  if (input.interruptClass === "critical") {
    present = false;
    suppressReasons.push("interrupt_not_toast");
  }
  if (!input.preferences.masterInAppPopupEnabled) {
    present = false;
    suppressReasons.push("master_popup_disabled");
  }
  const modulePrefs = input.preferences.modules[input.module];
  if (!modulePrefs.enabled) {
    present = false;
    suppressReasons.push("module_disabled");
  }
  if (isBelowMinLevel(input.level, modulePrefs.minLevel)) {
    present = false;
    suppressReasons.push("below_min_level");
  }
  return present;
}

function evaluateRaiseWindow(
  input: PresentationPolicyInput,
  suppressReasons: NotificationSuppressReason[],
): boolean {
  const modulePrefs = input.preferences.modules[input.module];
  let raise = true;
  if (modulePrefs.raiseWindow !== "errors_only") {
    raise = false;
    suppressReasons.push("raise_not_enabled");
  }
  if (input.level !== "warning" && input.level !== "error") {
    raise = false;
    suppressReasons.push("raise_level_too_low");
  }
  if (input.interruptClass !== "actionable") {
    raise = false;
    suppressReasons.push("raise_interrupt_denied");
  }
  if (!modulePrefs.enabled) {
    raise = false;
    pushUnique(suppressReasons, "module_disabled");
  }
  return raise;
}

function isBelowMinLevel(
  level: UserNotificationLevel,
  minLevel: UserNotificationLevel,
): boolean {
  return USER_NOTIFICATION_LEVEL_RANK[level] < USER_NOTIFICATION_LEVEL_RANK[minLevel];
}

function pushUnique(
  reasons: NotificationSuppressReason[],
  reason: NotificationSuppressReason,
): void {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
}
