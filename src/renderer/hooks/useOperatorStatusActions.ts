import { useEffect, useMemo, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type {
  AccountBootstrapProjection,
  OperatorStatusProjection,
} from "@application/index.js";
import {
  buildOperatorBreakReasonContext,
  deriveOperatorControlDisabledReason,
} from "@application/index.js";
import type { OperatorStatusDisabledReason } from "@application/index.js";
import { mapAgentStatusRejectionReason } from "../helpers/mapAgentStatusRejectionReason.js";

type UseOperatorStatusActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  operatorStatusProjection: OperatorStatusProjection;
  accountProjection: AccountBootstrapProjection;
}>;

type UseOperatorStatusActionsResult = Readonly<{
  visible: boolean;
  currentStatus: OperatorStatusProjection["currentStatus"];
  pendingStatus: OperatorStatusProjection["pendingStatus"];
  statusChangeInProgress: boolean;
  readyDisabledReason: OperatorStatusDisabledReason | null;
  breakDisabledReason: OperatorStatusDisabledReason | null;
  rejectionBanner: string | null;
  breakReasonPickerVisible: boolean;
  breakReasons: ReadonlyArray<string>;
  selectedBreakReason: string | null;
  logoutModalOpen: boolean;
  handleReady: () => void;
  handleBreak: () => void;
  handleSelectBreakReason: (reason: string) => void;
  handleConfirmBreak: () => void;
  handleOpenLogout: () => void;
  handleCloseLogout: () => void;
  handleLogoutSubmit: (reason: string) => void;
}>;

/**
 * - Purpose: bind operator status UI intents to AccountBootstrapFacade Use Cases.
 * - Inputs: facade, operator status projection, and account bootstrap projection.
 * - Outputs: disabled reasons, rejection banner, and status/logout action handlers.
 */
export function useOperatorStatusActions(
  input: UseOperatorStatusActionsInput,
): UseOperatorStatusActionsResult {
  const { facade, operatorStatusProjection, accountProjection } = input;
  const [breakReasonPickerVisible, setBreakReasonPickerVisible] = useState(false);
  const [selectedBreakReason, setSelectedBreakReason] = useState<string | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const phoneStatus = accountProjection.phoneStatus;
  const breakReasonRequired =
    operatorStatusProjection.allowedBreakReasonsCount > 0;

  const readyDisabledReason = useMemo(
    () =>
      deriveOperatorControlDisabledReason(
        operatorStatusProjection,
        "ready",
        phoneStatus,
        buildOperatorBreakReasonContext(
          "ready",
          breakReasonRequired,
          selectedBreakReason,
        ),
      ),
    [operatorStatusProjection, phoneStatus, breakReasonRequired, selectedBreakReason],
  );

  const breakDisabledReason = useMemo(() => {
    const reason = deriveOperatorControlDisabledReason(
      operatorStatusProjection,
      "break",
      phoneStatus,
      buildOperatorBreakReasonContext(
        "break",
        breakReasonRequired,
        selectedBreakReason,
      ),
    );
    if (reason === "break_reason_required") {
      return null;
    }
    return reason;
  }, [operatorStatusProjection, phoneStatus, breakReasonRequired, selectedBreakReason]);

  const rejectionBanner = mapAgentStatusRejectionReason(
    operatorStatusProjection.lastRejectionReason,
  );

  useEffect(() => {
    if (!operatorStatusProjection.statusChangeInProgress) {
      setBreakReasonPickerVisible(false);
      setSelectedBreakReason(null);
    }
  }, [operatorStatusProjection.statusChangeInProgress]);

  const handleReady = (): void => {
    if (facade === null || readyDisabledReason !== null) {
      return;
    }
    void facade.changeAgentStatus.execute({ targetStatus: "ready" });
  };

  const handleBreak = (): void => {
    if (facade === null || breakDisabledReason !== null) {
      return;
    }

    if (breakReasonRequired && selectedBreakReason === null) {
      setBreakReasonPickerVisible(true);
      return;
    }

    const breakInput =
      selectedBreakReason !== null && selectedBreakReason.length > 0
        ? { targetStatus: "break" as const, breakReason: selectedBreakReason }
        : { targetStatus: "break" as const };

    void facade.changeAgentStatus.execute(breakInput);
    setBreakReasonPickerVisible(false);
    setSelectedBreakReason(null);
  };

  const handleSelectBreakReason = (reason: string): void => {
    setSelectedBreakReason(reason.length > 0 ? reason : null);
  };

  const handleConfirmBreak = (): void => {
    handleBreak();
  };

  const handleOpenLogout = (): void => {
    if (!operatorStatusProjection.isOcpStatusAvailable) {
      return;
    }
    setLogoutModalOpen(true);
  };

  const handleCloseLogout = (): void => {
    setLogoutModalOpen(false);
  };

  const handleLogoutSubmit = (reason: string): void => {
    if (facade === null) {
      return;
    }
    void facade.logoutOperator.execute({ reason }).then((result) => {
      if (result.ok) {
        setLogoutModalOpen(false);
      }
    });
  };

  return {
    visible: operatorStatusProjection.isOcpStatusAvailable,
    currentStatus: operatorStatusProjection.currentStatus,
    pendingStatus: operatorStatusProjection.pendingStatus,
    statusChangeInProgress: operatorStatusProjection.statusChangeInProgress,
    readyDisabledReason,
    breakDisabledReason,
    rejectionBanner,
    breakReasonPickerVisible,
    breakReasons: operatorStatusProjection.allowedBreakReasons,
    selectedBreakReason,
    logoutModalOpen,
    handleReady,
    handleBreak,
    handleSelectBreakReason,
    handleConfirmBreak,
    handleOpenLogout,
    handleCloseLogout,
    handleLogoutSubmit,
  };
}
