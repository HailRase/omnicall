/**
 * - Purpose: OCP optional reject-with-break choice + reason modal for inbound calls.
 * - Inputs: facade, reject handlers from incoming call actions, optional notify.
 * - Outputs: choiceEnabled flag, modal state, and confirm/cancel/request handlers.
 *
 * Choice menu is shown only when OCP is authenticated and break reasons exist.
 * Confirm: RejectCall then ReservePostCallStatus(break, reasonId).
 */

import { useCallback, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { isErr } from "@shared/result/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import type { NotificationDescriptor } from "./useNotifications.js";
import type { OcpRejectBreakReasonItem } from "../components/integration/ocp/OcpRejectBreakReasonModal.js";

type UseOcpRejectWithBreakInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  callId: string | null;
  /** Plain SIP reject (also used for “without break”). */
  rejectIncoming: () => void;
  /** Reject with SIP break-reason label; returns false on failure. */
  rejectIncomingWithBreakReason: (breakReason: string) => Promise<boolean>;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

export type UseOcpRejectWithBreakResult = Readonly<{
  rejectChoiceEnabled: boolean;
  modalOpen: boolean;
  reasons: ReadonlyArray<OcpRejectBreakReasonItem>;
  selectedReasonId: number | null;
  submitting: boolean;
  handleRejectWithoutBreak: () => void;
  handleRequestRejectWithBreak: () => void;
  handleSelectReason: (reasonId: number) => void;
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
}>;

/**
 * - Purpose: wire OCP reject-with-break UX without Domain rules in components.
 */
export function useOcpRejectWithBreak(
  input: UseOcpRejectWithBreakInput,
): UseOcpRejectWithBreakResult {
  const { facade, callId, rejectIncoming, rejectIncomingWithBreakReason, notify } =
    input;
  const isAuthenticated = useAccountBootstrapStore(
    (state) => state.ocpSessionProjection.isAuthenticated,
  );
  const operatorId = useAccountBootstrapStore(
    (state) => state.ocpOperatorStatusProjection.operatorId,
  );
  const breakReasons = useAccountBootstrapStore(
    (state) => state.ocpReasonsProjection.breakReasons,
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reasons: ReadonlyArray<OcpRejectBreakReasonItem> = breakReasons.map((reason) => ({
    id: reason.id,
    label: reason.defaultDescription,
  }));

  const rejectChoiceEnabled = isAuthenticated && reasons.length > 0;

  const resetModal = useCallback((): void => {
    setModalOpen(false);
    setSelectedReasonId(null);
    setSubmitting(false);
  }, []);

  const handleRejectWithoutBreak = useCallback((): void => {
    rejectIncoming();
  }, [rejectIncoming]);

  const handleRequestRejectWithBreak = useCallback((): void => {
    if (!rejectChoiceEnabled || callId === null) {
      return;
    }
    setSelectedReasonId(null);
    setSubmitting(false);
    setModalOpen(true);
  }, [callId, rejectChoiceEnabled]);

  const handleSelectReason = useCallback((reasonId: number): void => {
    setSelectedReasonId(reasonId);
  }, []);

  const handleCancel = useCallback((): void => {
    if (submitting) {
      return;
    }
    resetModal();
  }, [resetModal, submitting]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (
      facade === null ||
      callId === null ||
      selectedReasonId === null ||
      operatorId === null ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);
    const selected = reasons.find((reason) => reason.id === selectedReasonId);
    const breakReasonLabel = selected?.label ?? String(selectedReasonId);

    const rejected = await rejectIncomingWithBreakReason(breakReasonLabel);
    if (!rejected) {
      setSubmitting(false);
      notify?.({
        level: "error",
        messageKey: "ocp.incomingCall.breakModal.rejectError",
        module: "ocp",
        functionId: "ocp.incoming.reject_with_break",
        interruptClass: "actionable",
      });
      return;
    }

    const reserveResult = await facade.reserveOcpPostCallStatus({
      operatorId,
      targetStatus: "break",
      reasonId: selectedReasonId,
    });

    if (isErr(reserveResult)) {
      setSubmitting(false);
      notify?.({
        level: "error",
        messageKey: "ocp.incomingCall.breakModal.reserveError",
        module: "ocp",
        functionId: "ocp.status.reserve",
        interruptClass: "actionable",
      });
      resetModal();
      return;
    }

    resetModal();
  }, [
    callId,
    facade,
    notify,
    operatorId,
    reasons,
    rejectIncomingWithBreakReason,
    resetModal,
    selectedReasonId,
    submitting,
  ]);

  return {
    rejectChoiceEnabled,
    modalOpen,
    reasons,
    selectedReasonId,
    submitting,
    handleRejectWithoutBreak,
    handleRequestRejectWithBreak,
    handleSelectReason,
    handleConfirm,
    handleCancel,
  };
}
