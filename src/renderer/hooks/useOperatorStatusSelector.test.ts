// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OperatorStatus,
  initialOcpReasonsProjection,
  initialOcpSessionProjection,
  initialOperatorStatusProjection,
} from "@application/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useOperatorStatusSelector } from "./useOperatorStatusSelector.js";

afterEach(() => {
  cleanup();
  useAccountBootstrapStore.setState({
    ocpSessionProjection: initialOcpSessionProjection(),
    ocpOperatorStatusProjection: initialOperatorStatusProjection(),
    ocpReasonsProjection: initialOcpReasonsProjection(),
  });
});

function setAuthenticatedReady(): void {
  useAccountBootstrapStore.setState({
    ocpSessionProjection: {
      ...initialOcpSessionProjection(),
      connectionState: "authenticated",
      isAuthenticated: true,
    },
    ocpOperatorStatusProjection: {
      ...initialOperatorStatusProjection(),
      operatorId: 10,
      status: OperatorStatus.READY,
      reasonId: 1,
      statusSince: Date.now() - 1_000,
      isBusy: false,
    },
    ocpReasonsProjection: {
      readyReasons: [
        {
          id: 1,
          parentStatus: OperatorStatus.READY,
          defaultDescription: "Ready",
        },
      ],
      breakReasons: [
        {
          id: 7,
          parentStatus: OperatorStatus.BREAK,
          defaultDescription: "Toilet break",
        },
        {
          id: 11,
          parentStatus: OperatorStatus.BREAK,
          defaultDescription: "Lunch",
        },
      ],
      logoutReasons: [],
    },
  });
}

describe("useOperatorStatusSelector", () => {
  it("hides authenticated flag when session is disconnected", () => {
    const { result } = renderHook(() =>
      useOperatorStatusSelector({
        facade: null,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );
    expect(result.current.vm.isAuthenticated).toBe(false);
  });

  it("keeps dropdown enabled when operator is busy", () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.TALKING,
        isBusy: true,
        reasonId: 0,
      },
    });
    const { result } = renderHook(() =>
      useOperatorStatusSelector({
        facade: null,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );
    expect(result.current.vm.isDropdownDisabled).toBe(false);
    expect(result.current.vm.dropdownDisabledReasonKey).toBeNull();
  });

  it("marks ready items disabled for DND guard", () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpReasonsProjection: {
        readyReasons: [
          {
            id: 1,
            parentStatus: OperatorStatus.READY,
            defaultDescription: "Ready",
          },
          {
            id: 3,
            parentStatus: OperatorStatus.READY,
            defaultDescription: "Standby",
          },
        ],
        breakReasons: [],
        logoutReasons: [],
      },
    });
    const { result } = renderHook(() =>
      useOperatorStatusSelector({
        facade: null,
        isSipRegistered: true,
        dndEnabled: true,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );
    expect(result.current.vm.currentItems[0]?.disabled).toBe(true);
    expect(result.current.vm.readyItems[0]?.disabled).toBe(true);
    expect(result.current.vm.readyItems[0]?.testId).toBe("ocp-ready-disabled-dnd");
  });

  it("marks ready items disabled when SIP is not registered", () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpReasonsProjection: {
        readyReasons: [
          {
            id: 1,
            parentStatus: OperatorStatus.READY,
            defaultDescription: "Ready",
          },
          {
            id: 3,
            parentStatus: OperatorStatus.READY,
            defaultDescription: "Standby",
          },
        ],
        breakReasons: [],
        logoutReasons: [],
      },
    });
    const { result } = renderHook(() =>
      useOperatorStatusSelector({
        facade: null,
        isSipRegistered: false,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );
    expect(result.current.vm.readyItems[0]?.testId).toBe("ocp-ready-disabled-sip");
  });

  it("invokes changeOcpOperatorStatus on select", () => {
    setAuthenticatedReady();
    const changeOcpOperatorStatus = vi.fn().mockResolvedValue({
      ok: true,
      value: { kind: "applied", targetStatus: "break", reasonId: 7 },
    });
    const facade = {
      changeOcpOperatorStatus,
      connectOcp: vi.fn(),
    };
    const { result } = renderHook(() =>
      useOperatorStatusSelector({
        facade: facade as never,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );

    act(() => {
      result.current.onSelectReason("break", 7);
    });

    expect(changeOcpOperatorStatus).toHaveBeenCalledWith({
      targetStatus: "break",
      reasonId: 7,
      intent: "auto",
    });
  });

  it("reserves with toast while talking", async () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.TALKING,
        isBusy: true,
        reasonId: 0,
      },
    });
    const changeOcpOperatorStatus = vi.fn().mockResolvedValue({
      ok: true,
      value: { kind: "reserved", targetStatus: "break", reasonId: 7 },
    });
    const notify = vi.fn();
    const facade = {
      changeOcpOperatorStatus,
      connectOcp: vi.fn(),
    };
    const { result } = renderHook(() =>
      useOperatorStatusSelector({
        facade: facade as never,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
        notify,
      }),
    );

    await act(async () => {
      result.current.onSelectReason("break", 7);
      await Promise.resolve();
    });

    expect(changeOcpOperatorStatus).toHaveBeenCalledWith({
      targetStatus: "break",
      reasonId: 7,
      intent: "reserve",
    });
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        messageKey: "ocp.status.reservedToast",
        messageParams: { reason: "Toilet break" },
      }),
    );
  });

  it("opens post-call modal instead of immediate change", () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.POST_CALL_PROCESSING,
        isBusy: true,
        reasonId: 0,
      },
    });
    const changeOcpOperatorStatus = vi.fn();
    const facade = {
      changeOcpOperatorStatus,
      connectOcp: vi.fn(),
    };
    const { result } = renderHook(() =>
      useOperatorStatusSelector({
        facade: facade as never,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );

    act(() => {
      result.current.onSelectReason("break", 7);
    });

    expect(changeOcpOperatorStatus).not.toHaveBeenCalled();
    expect(result.current.postCallModal.open).toBe(true);
    expect(result.current.postCallModal.pendingReasonLabel).toBe("Toilet break");
    expect(result.current.postCallModal.chosenAction).toBeNull();
  });

  it("applies finish intent from post-call modal confirm", async () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.POST_CALL_PROCESSING,
        isBusy: true,
        reasonId: 0,
      },
    });
    const changeOcpOperatorStatus = vi.fn().mockResolvedValue({
      ok: true,
      value: { kind: "applied", targetStatus: "break", reasonId: 7 },
    });
    const facade = {
      changeOcpOperatorStatus,
      connectOcp: vi.fn(),
    };
    const { result } = renderHook(() =>
      useOperatorStatusSelector({
        facade: facade as never,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );

    act(() => {
      result.current.onSelectReason("break", 7);
      result.current.onPostCallChooseFinish();
    });
    expect(result.current.postCallModal.chosenAction).toBe("finish");

    await act(async () => {
      result.current.onPostCallConfirm();
      await Promise.resolve();
    });

    expect(changeOcpOperatorStatus).toHaveBeenCalledWith({
      targetStatus: "break",
      reasonId: 7,
      intent: "apply",
    });
    expect(result.current.postCallModal.open).toBe(false);
  });

  it("keeps ready reason label while ringing instead of system status name", () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpReasonsProjection: {
        readyReasons: [
          {
            id: 1,
            parentStatus: OperatorStatus.READY,
            defaultDescription: "Доступен",
          },
        ],
        breakReasons: [
          {
            id: 7,
            parentStatus: OperatorStatus.BREAK,
            defaultDescription: "Toilet break",
          },
        ],
        logoutReasons: [],
      },
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.READY,
        reasonId: 1,
        isBusy: false,
      },
    });
    const { result, rerender } = renderHook(() =>
      useOperatorStatusSelector({
        facade: null,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );
    expect(result.current.vm.reasonLabel).toBe("Доступен");

    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.RINGING,
        reasonId: 0,
        isBusy: true,
      },
    });
    rerender();
    expect(result.current.vm.reasonLabel).toBe("Доступен");
  });

  it("switches break reason to ready reason without sticky break text", () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpReasonsProjection: {
        readyReasons: [
          {
            id: 1,
            parentStatus: OperatorStatus.READY,
            defaultDescription: "Доступен",
          },
        ],
        breakReasons: [
          {
            id: 7,
            parentStatus: OperatorStatus.BREAK,
            defaultDescription: "Toilet break",
          },
        ],
        logoutReasons: [],
      },
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.BREAK,
        reasonId: 7,
        isBusy: false,
      },
    });
    const { result, rerender } = renderHook(() =>
      useOperatorStatusSelector({
        facade: null,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );
    expect(result.current.vm.reasonLabel).toBe("Toilet break");

    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.READY,
        reasonId: 1,
        isBusy: false,
      },
    });
    rerender();
    expect(result.current.vm.reasonLabel).toBe("Доступен");
    expect(result.current.vm.allowStatusLabelFallback).toBe(false);
  });

  it("does not keep sticky break label when ready arrives without matching reason id", () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpReasonsProjection: {
        readyReasons: [
          {
            id: 1,
            parentStatus: OperatorStatus.READY,
            defaultDescription: "Доступен",
          },
        ],
        breakReasons: [
          {
            id: 7,
            parentStatus: OperatorStatus.BREAK,
            defaultDescription: "Toilet break",
          },
        ],
        logoutReasons: [],
      },
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.BREAK,
        reasonId: 7,
        isBusy: false,
      },
    });
    const { result, rerender } = renderHook(() =>
      useOperatorStatusSelector({
        facade: null,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );
    expect(result.current.vm.reasonLabel).toBe("Toilet break");

    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.READY,
        reasonId: 0,
        isBusy: false,
      },
    });
    rerender();
    expect(result.current.vm.reasonLabel).toBe("");
    expect(result.current.vm.allowStatusLabelFallback).toBe(true);
  });

  it("skips use case when selecting the same current reason", () => {
    setAuthenticatedReady();
    const changeOcpOperatorStatus = vi.fn();
    const facade = {
      changeOcpOperatorStatus,
      connectOcp: vi.fn(),
    };
    const { result } = renderHook(() =>
      useOperatorStatusSelector({
        facade: facade as never,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );

    act(() => {
      result.current.onSelectReason("ready", 1);
    });

    expect(changeOcpOperatorStatus).not.toHaveBeenCalled();
  });

  it("allows break-to-break reason change", () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.BREAK,
        reasonId: 7,
        isBusy: false,
      },
    });
    const changeOcpOperatorStatus = vi.fn().mockResolvedValue({
      ok: true,
      value: { kind: "applied", targetStatus: "break", reasonId: 11 },
    });
    const facade = {
      changeOcpOperatorStatus,
      connectOcp: vi.fn(),
    };
    const { result } = renderHook(() =>
      useOperatorStatusSelector({
        facade: facade as never,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );

    expect(result.current.vm.currentItems).toEqual([
      expect.objectContaining({
        reasonId: 7,
        targetStatus: "break",
        isCurrent: true,
      }),
    ]);
    expect(result.current.vm.breakItems.map((item) => item.reasonId)).toEqual([11]);

    act(() => {
      result.current.onSelectReason("break", 11);
    });

    expect(changeOcpOperatorStatus).toHaveBeenCalledWith({
      targetStatus: "break",
      reasonId: 11,
      intent: "auto",
    });
  });

  it("pins current ready reason above other dropdown items", () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpReasonsProjection: {
        readyReasons: [
          {
            id: 1,
            parentStatus: OperatorStatus.READY,
            defaultDescription: "Ready",
          },
          {
            id: 3,
            parentStatus: OperatorStatus.READY,
            defaultDescription: "Standby",
          },
        ],
        breakReasons: [
          {
            id: 7,
            parentStatus: OperatorStatus.BREAK,
            defaultDescription: "Toilet break",
          },
        ],
        logoutReasons: [],
      },
    });
    const { result } = renderHook(() =>
      useOperatorStatusSelector({
        facade: null,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );

    expect(result.current.vm.currentItems.map((item) => item.reasonId)).toEqual([1]);
    expect(result.current.vm.readyItems.map((item) => item.reasonId)).toEqual([3]);
    expect(result.current.vm.breakItems.map((item) => item.reasonId)).toEqual([7]);
  });
});
