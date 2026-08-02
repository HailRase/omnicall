/**
 * - Purpose: open OCP logout-reason overlay or fall through to SIP logout.
 * - Inputs: facade, fallback SIP session actions, optional notify.
 * - Outputs: modal state + request/confirm/cancel handlers (no Domain rules).
 *
 * Gate reads live OcpProjectionHub at click time (avoids stale Zustand/settings):
 * - authenticated | connected | connecting | reconnecting → open reason modal
 * - otherwise → SIP-only logout
 *
 * Confirm:
 * Application owns the complete OCP → SIP → local account cascade.
 */

import { useCallback, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { OcpSessionProjection } from "@application/index.js";
import { isErr } from "@shared/result/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import type { NotificationDescriptor } from "./useNotifications.js";
import type { UseSessionLogoutActionsResult } from "./useSessionLogoutActions.js";
import type { OcpLogoutReasonItem } from "../components/integration/ocp/OcpLogoutReasonModal.js";

type OcpConnectionState = OcpSessionProjection["connectionState"];
type UseOcpLogoutModalInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  sessionLogoutActions: UseSessionLogoutActionsResult;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

export type UseOcpLogoutModalResult = Readonly<{
  modalOpen: boolean;
  reasons: ReadonlyArray<OcpLogoutReasonItem>;
  selectedReasonId: number | null;
  submitting: boolean;
  requireReasonSelection: boolean;
  handleRequestLogout: () => void;
  handleSelectReason: (reasonId: number) => void;
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
}>;

function isOcpSessionLive(connectionState: OcpConnectionState): boolean {
  return (
    connectionState === "connected" ||
    connectionState === "authenticated" ||
    connectionState === "connecting" ||
    connectionState === "reconnecting"
  );
}

function readLiveOcpSession(facade: AccountBootstrapFacade | null): Readonly<{
  isAuthenticated: boolean;
  connectionState: OcpConnectionState;
}> {
  if (facade !== null) {
    const session = facade.getOcpSessionSnapshot();
    return {
      isAuthenticated: session.isAuthenticated,
      connectionState: session.connectionState,
    };
  }
  const fallback = useAccountBootstrapStore.getState().ocpSessionProjection;
  return {
    isAuthenticated: fallback.isAuthenticated,
    connectionState: fallback.connectionState,
  };
}

/**
 * - Purpose: branch avatar-menu logout between OCP reason modal and SIP-only logout.
 */
export function useOcpLogoutModal(input: UseOcpLogoutModalInput): UseOcpLogoutModalResult {
  const { facade, sessionLogoutActions, notify } = input;
  const logoutReasons = useAccountBootstrapStore(
    (state) => state.ocpReasonsProjection.logoutReasons,
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requireReasonSelection, setRequireReasonSelection] = useState(true);

  const reasons: ReadonlyArray<OcpLogoutReasonItem> = logoutReasons.map((reason) => ({
    id: reason.id,
    label: reason.defaultDescription,
  }));

  const resetModal = useCallback((): void => {
    setModalOpen(false);
    setSelectedReasonId(null);
    setSubmitting(false);
    setRequireReasonSelection(true);
  }, []);

  const endSipSession = useCallback((): void => {
    sessionLogoutActions.handleEndSession();
  }, [sessionLogoutActions]);

  const handleRequestLogout = useCallback((): void => {
    const live = readLiveOcpSession(facade);

    if (live.isAuthenticated || isOcpSessionLive(live.connectionState)) {
      setSelectedReasonId(null);
      setSubmitting(false);
      setRequireReasonSelection(live.isAuthenticated || logoutReasons.length > 0);
      setModalOpen(true);
      return;
    }

    if (facade === null) {
      endSipSession();
      return;
    }
    void facade.logoutAccountSession().then((result) => {
      if (isErr(result)) {
        notify?.({
          level: "error",
          messageKey: "ocp.logout.modal.error",
          module: "account",
          functionId: "account.logout",
          interruptClass: "actionable",
        });
      }
    });
  }, [endSipSession, facade, logoutReasons.length, notify]);

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
    if (facade === null || submitting) {
      return;
    }
    if (requireReasonSelection && selectedReasonId === null) {
      return;
    }

    setSubmitting(true);
    const result = await facade.logoutAccountSession(
      selectedReasonId === null ? {} : { reasonId: selectedReasonId },
    );
    if (isErr(result)) {
      setSubmitting(false);
      notify?.({
        level: "error",
        messageKey: "ocp.logout.modal.error",
        module: "account",
        functionId: "account.logout",
        interruptClass: "actionable",
      });
      return;
    }

    resetModal();
  }, [
    facade,
    notify,
    requireReasonSelection,
    resetModal,
    selectedReasonId,
    submitting,
  ]);

  return {
    modalOpen,
    reasons,
    selectedReasonId,
    submitting,
    requireReasonSelection,
    handleRequestLogout,
    handleSelectReason,
    handleConfirm,
    handleCancel,
  };
}
