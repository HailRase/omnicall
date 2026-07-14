// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OperatorStatus,
  initialOcpReasonsProjection,
  initialOcpSessionProjection,
} from "@application/index.js";
import { ok, err } from "@shared/result/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useOcpLogoutModal } from "./useOcpLogoutModal.js";
import type { UseSessionLogoutActionsResult } from "./useSessionLogoutActions.js";

afterEach(() => {
  cleanup();
  useAccountBootstrapStore.setState({
    ocpSessionProjection: initialOcpSessionProjection(),
    ocpReasonsProjection: initialOcpReasonsProjection(),
  });
});

function createSessionLogoutActions(): UseSessionLogoutActionsResult {
  return {
    shell: {
      showEndSessionControl: true,
      endSessionDisabledReason: null,
      logoutConfirmationRequired: false,
      logoutInProgress: false,
      showLogoutErrorBanner: false,
      logoutErrorMessage: null,
    },
    confirmationModalOpen: false,
    handleEndSession: vi.fn(),
    handleConfirmLogout: vi.fn(),
    handleCancelLogout: vi.fn(),
    handleRetryLogout: vi.fn(),
  };
}

function createFacade(session: {
  isAuthenticated: boolean;
  connectionState: string;
  logoutOcpOperator?: ReturnType<typeof vi.fn>;
  disconnectOcp?: ReturnType<typeof vi.fn>;
}): never {
  return {
    getOcpSessionSnapshot: () => session,
    getOcpOperatorSnapshot: () =>
      session.isAuthenticated
        ? {
            operatorId: 42,
            status: OperatorStatus.READY,
            reasonId: 1,
            statusSince: Date.now(),
            isBusy: false,
            reservedStatus: null,
            reservedReasonId: null,
          }
        : {
            operatorId: null,
            status: null,
            reasonId: 0,
            statusSince: null,
            isBusy: false,
            reservedStatus: null,
            reservedReasonId: null,
          },
    logoutOcpOperator:
      session.logoutOcpOperator ?? vi.fn().mockResolvedValue(ok(undefined)),
    disconnectOcp: session.disconnectOcp ?? vi.fn().mockResolvedValue(ok(undefined)),
  } as never;
}

describe("useOcpLogoutModal", () => {
  it("falls back to SIP logout when OCP is disconnected", () => {
    const sessionLogoutActions = createSessionLogoutActions();
    const { result } = renderHook(() =>
      useOcpLogoutModal({
        facade: createFacade({
          isAuthenticated: false,
          connectionState: "disconnected",
        }),
        sessionLogoutActions,
      }),
    );

    act(() => {
      result.current.handleRequestLogout();
    });

    expect(sessionLogoutActions.handleEndSession).toHaveBeenCalledTimes(1);
    expect(result.current.modalOpen).toBe(false);
  });

  it("opens modal from live hub when authenticated even if zustand store is stale", () => {
    useAccountBootstrapStore.setState({
      ocpSessionProjection: initialOcpSessionProjection(),
      ocpReasonsProjection: {
        ...initialOcpReasonsProjection(),
        logoutReasons: [
          {
            id: 9,
            parentStatus: OperatorStatus.LOGOUT,
            defaultDescription: "End of shift",
          },
        ],
      },
    });

    const sessionLogoutActions = createSessionLogoutActions();
    const { result } = renderHook(() =>
      useOcpLogoutModal({
        facade: createFacade({
          isAuthenticated: true,
          connectionState: "authenticated",
        }),
        sessionLogoutActions,
      }),
    );

    act(() => {
      result.current.handleRequestLogout();
    });

    expect(result.current.modalOpen).toBe(true);
    expect(result.current.requireReasonSelection).toBe(true);
    expect(sessionLogoutActions.handleEndSession).not.toHaveBeenCalled();
  });

  it("opens modal when OCP is connected (Подключено) without authenticated yet", () => {
    const sessionLogoutActions = createSessionLogoutActions();
    const { result } = renderHook(() =>
      useOcpLogoutModal({
        facade: createFacade({
          isAuthenticated: false,
          connectionState: "connected",
        }),
        sessionLogoutActions,
      }),
    );

    act(() => {
      result.current.handleRequestLogout();
    });

    expect(result.current.modalOpen).toBe(true);
    expect(result.current.requireReasonSelection).toBe(false);
    expect(sessionLogoutActions.handleEndSession).not.toHaveBeenCalled();
  });

  it("disconnects OCP then SIP on confirm when connected-only", async () => {
    const disconnectOcp = vi.fn().mockResolvedValue(ok(undefined));
    const sessionLogoutActions = createSessionLogoutActions();
    const { result } = renderHook(() =>
      useOcpLogoutModal({
        facade: createFacade({
          isAuthenticated: false,
          connectionState: "connected",
          disconnectOcp,
        }),
        sessionLogoutActions,
      }),
    );

    act(() => {
      result.current.handleRequestLogout();
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(disconnectOcp).toHaveBeenCalledTimes(1);
    expect(sessionLogoutActions.handleEndSession).toHaveBeenCalledTimes(1);
    expect(result.current.modalOpen).toBe(false);
  });

  it("logs out OCP then SIP on confirm when authenticated", async () => {
    useAccountBootstrapStore.setState({
      ocpReasonsProjection: {
        ...initialOcpReasonsProjection(),
        logoutReasons: [
          {
            id: 9,
            parentStatus: OperatorStatus.LOGOUT,
            defaultDescription: "End of shift",
          },
        ],
      },
    });

    const logoutOcpOperator = vi.fn().mockResolvedValue(ok(undefined));
    const sessionLogoutActions = createSessionLogoutActions();
    const { result } = renderHook(() =>
      useOcpLogoutModal({
        facade: createFacade({
          isAuthenticated: true,
          connectionState: "authenticated",
          logoutOcpOperator,
        }),
        sessionLogoutActions,
      }),
    );

    act(() => {
      result.current.handleRequestLogout();
      result.current.handleSelectReason(9);
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(logoutOcpOperator).toHaveBeenCalledWith({
      reasonId: 9,
      cascadeSipLogout: true,
    });
    expect(sessionLogoutActions.handleEndSession).toHaveBeenCalledTimes(1);
    expect(result.current.modalOpen).toBe(false);
  });

  it("notifies on OCP logout failure without SIP logout", async () => {
    const logoutOcpOperator = vi
      .fn()
      .mockResolvedValue(err(createPlatformError("operation_failed", "ocp_logout_failed")));
    const notify = vi.fn();
    const sessionLogoutActions = createSessionLogoutActions();
    const { result } = renderHook(() =>
      useOcpLogoutModal({
        facade: createFacade({
          isAuthenticated: true,
          connectionState: "authenticated",
          logoutOcpOperator,
        }),
        sessionLogoutActions,
        notify,
      }),
    );

    act(() => {
      result.current.handleRequestLogout();
      result.current.handleSelectReason(9);
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(notify).toHaveBeenCalledWith({
      level: "error",
      messageKey: "ocp.logout.modal.error",
    });
    expect(sessionLogoutActions.handleEndSession).not.toHaveBeenCalled();
    expect(result.current.modalOpen).toBe(true);
  });
});
