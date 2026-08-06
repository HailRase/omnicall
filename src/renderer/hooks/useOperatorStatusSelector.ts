/**
 * - Purpose: build presentational VM for OCP operator status selector + connection chrome.
 * - Inputs: facade, SIP registration, DND, open-Settings callback, optional notify; Zustand OCP projections.
 * - Outputs: serializable-friendly VM + callbacks (change status / finish appeal / retry).
 */

import { useCallback, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  isOperatorStatusSelectorDisabled,
  OCP_MAX_RECONNECT_ATTEMPTS,
  OperatorStatus,
  resolveOperatorStatusChangeModeFromProjection,
  resolveOperatorStatusColorVar,
  resolveOperatorStatusLabelKey,
  resolveOperatorStatusOptionIsCurrent,
  resolvePostCallFinishAppealProjection,
  type OcpOperatorStatusLabelKey,
} from "@application/index.js";
import { isOk } from "@shared/result/index.js";
import type { TranslationKey } from "../i18n/messages.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import type { NotificationDescriptor } from "./useNotifications.js";

export type OcpStatusDropdownItemVm = Readonly<{
  reasonId: number;
  label: string;
  targetStatus: "ready" | "break";
  disabled: boolean;
  disabledReasonKey: TranslationKey | null;
  testId: string | null;
  isCurrent: boolean;
}>;

export type OperatorStatusSelectorVm = Readonly<{
  isAuthenticated: boolean;
  statusColor: string;
  /** Reason description when known; may be empty for idle fallback via statusLabelKey. */
  reasonLabel: string;
  /** When true, UI may fall back to statusLabelKey (Ready/Break/Preparing only). */
  allowStatusLabelFallback: boolean;
  statusLabelKey: OcpOperatorStatusLabelKey | "ocp.operatorStatus.unknown";
  timerSince: number | null;
  isDropdownDisabled: boolean;
  dropdownDisabledReasonKey: TranslationKey | null;
  readyItems: ReadonlyArray<OcpStatusDropdownItemVm>;
  breakItems: ReadonlyArray<OcpStatusDropdownItemVm>;
  isReconnecting: boolean;
  isFailed: boolean;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
}>;

export type PostCallFinishAppealVm = Readonly<{
  visible: boolean;
  /** Localized reason / Available label shown after the finish prefix. */
  statusLabel: string;
  submitting: boolean;
  disabled: boolean;
  disabledReasonKey: TranslationKey | null;
}>;

export type UseOperatorStatusSelectorResult = Readonly<{
  vm: OperatorStatusSelectorVm;
  finishAppeal: PostCallFinishAppealVm;
  onSelectReason: (targetStatus: "ready" | "break", reasonId: number) => void;
  onFinishAppeal: () => void;
  onRetryConnect: () => void;
  onOpenIntegrationsSettings: () => void;
}>;

type UseOperatorStatusSelectorInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  isSipRegistered: boolean;
  dndEnabled: boolean;
  onOpenIntegrationsSettings: () => void;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

type PendingSelection = Readonly<{
  targetStatus: "ready" | "break";
  reasonId: number;
  reasonLabel: string;
}>;

function resolveReadyDisabled(
  isSipRegistered: boolean,
  dndEnabled: boolean,
): Readonly<{ disabled: boolean; reasonKey: TranslationKey | null; testId: string | null }> {
  if (!isSipRegistered) {
    return {
      disabled: true,
      reasonKey: "ocp.dropdown.disabledSip",
      testId: "ocp-ready-disabled-sip",
    };
  }
  if (dndEnabled) {
    return {
      disabled: true,
      reasonKey: "ocp.dropdown.disabledDnd",
      testId: "ocp-ready-disabled-dnd",
    };
  }
  return { disabled: false, reasonKey: null, testId: null };
}

function isIdleUserStatus(status: number | null): boolean {
  return (
    status === OperatorStatus.READY ||
    status === OperatorStatus.BREAK ||
    status === OperatorStatus.PREPARING_TO_WORK
  );
}

/**
 * - Purpose: sole projection consumer for operator status header chrome.
 * - Chip label follows server `users` projection only (no optimistic click override).
 * - Post-call: reason clicks reserve; footer finish applies reserved or Ready.
 */
export function useOperatorStatusSelector(
  input: UseOperatorStatusSelectorInput,
): UseOperatorStatusSelectorResult {
  const session = useAccountBootstrapStore((state) => state.ocpSessionProjection);
  const operator = useAccountBootstrapStore((state) => state.ocpOperatorStatusProjection);
  const reasons = useAccountBootstrapStore((state) => state.ocpReasonsProjection);

  const [finishSubmitting, setFinishSubmitting] = useState(false);

  const readyGuard = resolveReadyDisabled(input.isSipRegistered, input.dndEnabled);
  const dropdownDisabled = isOperatorStatusSelectorDisabled(operator.status);

  const idle = isIdleUserStatus(operator.status);

  /**
   * Idle Ready/Break/Preparing: show reason description from operator_status_reasons.
   * System/busy (RINGING/TALKING/…): leave reason empty so UI falls back to
   * statusLabelKey (canonical OCP labels: Звонок, Разговор, …).
   */
  const displayReasonLabel = idle
    ? resolveCurrentReasonLabel(
        operator.reasonId,
        operator.status,
        reasons.readyReasons,
        reasons.breakReasons,
      )
    : "";

  const readyItems = reasons.readyReasons.map((reason) => ({
    reasonId: reason.id,
    label: reason.defaultDescription,
    targetStatus: "ready" as const,
    disabled: readyGuard.disabled,
    disabledReasonKey: readyGuard.reasonKey,
    testId: readyGuard.testId,
    // Idle Ready match, or busy/PCP booking via reserved* (see resolveOperatorStatusOptionIsCurrent).
    isCurrent: resolveOperatorStatusOptionIsCurrent({
      optionTarget: "ready",
      optionReasonId: reason.id,
      status: operator.status,
      reasonId: operator.reasonId,
      reservedStatus: operator.reservedStatus,
      reservedReasonId: operator.reservedReasonId,
    }),
  }));

  const breakItems = reasons.breakReasons.map((reason) => ({
    reasonId: reason.id,
    label: reason.defaultDescription,
    targetStatus: "break" as const,
    disabled: false,
    disabledReasonKey: null,
    testId: null,
    isCurrent: resolveOperatorStatusOptionIsCurrent({
      optionTarget: "break",
      optionReasonId: reason.id,
      status: operator.status,
      reasonId: operator.reasonId,
      reservedStatus: operator.reservedStatus,
      reservedReasonId: operator.reservedReasonId,
    }),
  }));

  const finishProjection = resolvePostCallFinishAppealProjection(
    operator.status,
    operator.reservedStatus,
    operator.reservedReasonId,
  );

  const finishStatusLabel = finishProjection.visible
    ? resolveFinishAppealStatusLabel(
        finishProjection.targetStatus,
        finishProjection.reasonId,
        reasons.readyReasons,
        reasons.breakReasons,
      )
    : "";

  const finishDisabledByDnd =
    finishProjection.visible &&
    finishProjection.targetStatus === "ready" &&
    input.dndEnabled;

  const finishAppeal: PostCallFinishAppealVm = {
    visible: finishProjection.visible,
    statusLabel: finishStatusLabel,
    submitting: finishSubmitting,
    disabled: finishDisabledByDnd || finishSubmitting,
    disabledReasonKey: finishDisabledByDnd ? "ocp.dropdown.disabledDnd" : null,
  };

  const vm: OperatorStatusSelectorVm = {
    isAuthenticated: session.isAuthenticated,
    statusColor: resolveOperatorStatusColorVar(operator.status),
    reasonLabel: displayReasonLabel,
    allowStatusLabelFallback:
      displayReasonLabel.length === 0 && operator.status !== null,
    statusLabelKey: resolveOperatorStatusLabelKey(operator.status),
    timerSince: operator.statusSince,
    isDropdownDisabled: dropdownDisabled,
    dropdownDisabledReasonKey: null,
    readyItems,
    breakItems,
    isReconnecting:
      session.transportRecoveryActive ||
      session.connectionState === "reconnecting",
    isFailed:
      !session.transportRecoveryActive && session.connectionState === "failed",
    reconnectAttempt:
      session.transportRecoveryAttempt > 0
        ? session.transportRecoveryAttempt
        : session.reconnectAttempt,
    maxReconnectAttempts: OCP_MAX_RECONNECT_ATTEMPTS,
  };

  const notify = input.notify;

  const notifyReserved = useCallback(
    (reasonLabel: string): void => {
      notify?.({
        id: `ocp-status-reserved-${Date.now()}`,
        level: "success",
        messageKey: "ocp.status.reservedToast",
        messageParams: { reason: reasonLabel },
        module: "ocp",
        functionId: "ocp.status.reserved",
        interruptClass: "informational",
      });
    },
    [notify],
  );

  const executeChange = useCallback(
    async (
      selection: PendingSelection,
      intent: "auto" | "apply" | "reserve",
    ): Promise<void> => {
      if (input.facade === null) {
        return;
      }
      const result = await input.facade.changeOcpOperatorStatus({
        targetStatus: selection.targetStatus,
        reasonId: selection.reasonId,
        intent,
      });
      if (isOk(result) && result.value.kind === "reserved") {
        try {
          notifyReserved(selection.reasonLabel);
        } catch {
          // Reservation succeeded; toast resolution must not fail the command path.
        }
      }
    },
    [input.facade, notifyReserved],
  );

  const onSelectReason = useCallback(
    (targetStatus: "ready" | "break", reasonId: number): void => {
      if (input.facade === null) {
        return;
      }
      if (
        (targetStatus === "ready" && operator.status === OperatorStatus.READY) ||
        (targetStatus === "break" && operator.status === OperatorStatus.BREAK)
      ) {
        if (operator.reasonId === reasonId) {
          return;
        }
      }
      if (targetStatus === "ready" && readyGuard.disabled) {
        return;
      }

      const reasonLabel = resolveReasonLabel(
        reasonId,
        targetStatus,
        reasons.readyReasons,
        reasons.breakReasons,
      );
      const selection: PendingSelection = { targetStatus, reasonId, reasonLabel };
      const mode = resolveOperatorStatusChangeModeFromProjection(operator.status);
      const intent = mode === "reserve" ? "reserve" : "auto";
      void executeChange(selection, intent);
    },
    [
      executeChange,
      input.facade,
      operator.reasonId,
      operator.status,
      readyGuard.disabled,
      reasons.breakReasons,
      reasons.readyReasons,
    ],
  );

  const onFinishAppeal = useCallback((): void => {
    if (input.facade === null || !finishAppeal.visible || finishAppeal.disabled) {
      return;
    }
    setFinishSubmitting(true);
    void (async () => {
      try {
        await input.facade?.finishOcpPostCallAppeal();
      } finally {
        setFinishSubmitting(false);
      }
    })();
  }, [finishAppeal.disabled, finishAppeal.visible, input.facade]);

  const onRetryConnect = useCallback((): void => {
    if (input.facade === null) {
      return;
    }
    // Same dual-FSM owner as System State «Повторить сервер» (ADR-AF-002).
    void (async (): Promise<void> => {
      const recovery = await input.facade!.dispatchAccountRecoveryAction(
        "retry_server",
      );
      if (recovery.ok) {
        return;
      }
      // Rare: action not allowed by snapshot — fall back to fresh-token connect.
      if (recovery.error.message === "authorization_retry_unavailable") {
        await input.facade!.connectOcp();
      }
    })();
  }, [input.facade]);

  return {
    vm,
    finishAppeal,
    onSelectReason,
    onFinishAppeal,
    onRetryConnect,
    onOpenIntegrationsSettings: input.onOpenIntegrationsSettings,
  };
}

function resolveReasonLabel(
  reasonId: number,
  targetStatus: "ready" | "break",
  readyReasons: ReadonlyArray<Readonly<{ id: number; defaultDescription: string }>>,
  breakReasons: ReadonlyArray<Readonly<{ id: number; defaultDescription: string }>>,
): string {
  const list = targetStatus === "ready" ? readyReasons : breakReasons;
  const found = list.find((reason) => reason.id === reasonId);
  return found?.defaultDescription ?? "";
}

function resolveFinishAppealStatusLabel(
  targetStatus: "ready" | "break",
  reasonId: number,
  readyReasons: ReadonlyArray<Readonly<{ id: number; defaultDescription: string }>>,
  breakReasons: ReadonlyArray<Readonly<{ id: number; defaultDescription: string }>>,
): string {
  const fromCatalog = resolveReasonLabel(
    reasonId,
    targetStatus,
    readyReasons,
    breakReasons,
  );
  if (fromCatalog.length > 0) {
    return fromCatalog;
  }
  if (targetStatus === "ready") {
    return (
      readyReasons.find((reason) => reason.id === OperatorStatus.READY)
        ?.defaultDescription ?? ""
    );
  }
  return "";
}

/**
 * Resolve reason text for idle Ready/Break/Preparing only.
 * Break→Ready must not keep a break description under a ready color.
 */
function resolveCurrentReasonLabel(
  reasonId: number,
  status: number | null,
  readyReasons: ReadonlyArray<Readonly<{ id: number; defaultDescription: string }>>,
  breakReasons: ReadonlyArray<Readonly<{ id: number; defaultDescription: string }>>,
): string {
  if (status === OperatorStatus.READY || status === OperatorStatus.PREPARING_TO_WORK) {
    return (
      readyReasons.find((reason) => reason.id === reasonId)?.defaultDescription ?? ""
    );
  }
  if (status === OperatorStatus.BREAK) {
    return (
      breakReasons.find((reason) => reason.id === reasonId)?.defaultDescription ?? ""
    );
  }
  return "";
}
