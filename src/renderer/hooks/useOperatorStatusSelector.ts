/**
 * - Purpose: build presentational VM for OCP operator status selector + connection chrome.
 * - Inputs: facade, SIP registration, DND, open-Settings callback, optional notify; Zustand OCP projections.
 * - Outputs: serializable-friendly VM + callbacks (change status / post-call modal / retry).
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

export type OcpPostCallStatusModalVm = Readonly<{
  open: boolean;
  pendingTargetStatus: "ready" | "break";
  pendingReasonId: number;
  pendingReasonLabel: string;
  chosenAction: "finish" | "reserve" | null;
  submitting: boolean;
}>;

export type UseOperatorStatusSelectorResult = Readonly<{
  vm: OperatorStatusSelectorVm;
  postCallModal: OcpPostCallStatusModalVm;
  onSelectReason: (targetStatus: "ready" | "break", reasonId: number) => void;
  onPostCallChooseFinish: () => void;
  onPostCallChooseReserve: () => void;
  onPostCallConfirm: () => void;
  onPostCallCancel: () => void;
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

const CLOSED_POST_CALL_MODAL: OcpPostCallStatusModalVm = {
  open: false,
  pendingTargetStatus: "break",
  pendingReasonId: 0,
  pendingReasonLabel: "",
  chosenAction: null,
  submitting: false,
};

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
 */
export function useOperatorStatusSelector(
  input: UseOperatorStatusSelectorInput,
): UseOperatorStatusSelectorResult {
  const session = useAccountBootstrapStore((state) => state.ocpSessionProjection);
  const operator = useAccountBootstrapStore((state) => state.ocpOperatorStatusProjection);
  const reasons = useAccountBootstrapStore((state) => state.ocpReasonsProjection);

  const [postCallModal, setPostCallModal] =
    useState<OcpPostCallStatusModalVm>(CLOSED_POST_CALL_MODAL);

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
    // Strict match only — Preparing / Ringing / Talking / unknown reasonId → no active option.
    isCurrent:
      operator.status === OperatorStatus.READY && operator.reasonId === reason.id,
  }));

  const breakItems = reasons.breakReasons.map((reason) => ({
    reasonId: reason.id,
    label: reason.defaultDescription,
    targetStatus: "break" as const,
    disabled: false,
    disabledReasonKey: null,
    testId: null,
    isCurrent:
      operator.status === OperatorStatus.BREAK && operator.reasonId === reason.id,
  }));

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
    isReconnecting: session.connectionState === "reconnecting",
    isFailed: session.connectionState === "failed",
    reconnectAttempt: session.reconnectAttempt,
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

      if (mode === "choose") {
        setPostCallModal({
          open: true,
          pendingTargetStatus: targetStatus,
          pendingReasonId: reasonId,
          pendingReasonLabel: reasonLabel,
          chosenAction: null,
          submitting: false,
        });
        return;
      }

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

  const onPostCallChooseFinish = useCallback((): void => {
    setPostCallModal((prev) =>
      prev.open ? { ...prev, chosenAction: "finish" } : prev,
    );
  }, []);

  const onPostCallChooseReserve = useCallback((): void => {
    setPostCallModal((prev) =>
      prev.open ? { ...prev, chosenAction: "reserve" } : prev,
    );
  }, []);

  const onPostCallCancel = useCallback((): void => {
    setPostCallModal(CLOSED_POST_CALL_MODAL);
  }, []);

  const onPostCallConfirm = useCallback((): void => {
    if (!postCallModal.open || postCallModal.chosenAction === null) {
      return;
    }
    const selection: PendingSelection = {
      targetStatus: postCallModal.pendingTargetStatus,
      reasonId: postCallModal.pendingReasonId,
      reasonLabel: postCallModal.pendingReasonLabel,
    };
    const intent = postCallModal.chosenAction === "finish" ? "apply" : "reserve";
    setPostCallModal((prev) => ({ ...prev, submitting: true }));
    void (async () => {
      try {
        await executeChange(selection, intent);
      } finally {
        setPostCallModal(CLOSED_POST_CALL_MODAL);
      }
    })();
  }, [executeChange, postCallModal]);

  const onRetryConnect = useCallback((): void => {
    if (input.facade === null) {
      return;
    }
    void input.facade.connectOcp();
  }, [input.facade]);

  return {
    vm,
    postCallModal,
    onSelectReason,
    onPostCallChooseFinish,
    onPostCallChooseReserve,
    onPostCallConfirm,
    onPostCallCancel,
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
