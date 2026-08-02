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
    expect(result.current.vm.readyItems[0]?.disabled).toBe(true);
    expect(result.current.vm.readyItems[0]?.testId).toBe("ocp-ready-disabled-dnd");
    expect(result.current.vm.readyItems.every((item) => item.disabled)).toBe(true);
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
        module: "ocp",
        functionId: "ocp.status.reserved",
        interruptClass: "informational",
      }),
    );
  });

  it("reserves immediately during post-call processing without modal", async () => {
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
      value: { kind: "reserved", targetStatus: "break", reasonId: 7 },
    });
    const notify = vi.fn();
    const facade = {
      changeOcpOperatorStatus,
      finishOcpPostCallAppeal: vi.fn(),
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

    expect(result.current.finishAppeal.visible).toBe(true);
    expect(result.current.finishAppeal.statusLabel).toBe("Ready");

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
        module: "ocp",
        functionId: "ocp.status.reserved",
        interruptClass: "informational",
      }),
    );
  });

  it("shows reserved reason on finish appeal and calls finish use case", async () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.POST_CALL_PROCESSING,
        isBusy: true,
        reasonId: 0,
        reservedStatus: OperatorStatus.BREAK,
        reservedReasonId: 7,
      },
    });
    const finishOcpPostCallAppeal = vi.fn().mockResolvedValue({
      ok: true,
      value: { kind: "applied", targetStatus: "break", reasonId: 7 },
    });
    const facade = {
      changeOcpOperatorStatus: vi.fn(),
      finishOcpPostCallAppeal,
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

    expect(result.current.finishAppeal.visible).toBe(true);
    expect(result.current.finishAppeal.statusLabel).toBe("Toilet break");
    expect(result.current.vm.breakItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reasonId: 7, isCurrent: true }),
      ]),
    );
    expect(result.current.vm.readyItems.every((item) => !item.isCurrent)).toBe(
      true,
    );

    await act(async () => {
      result.current.onFinishAppeal();
      await Promise.resolve();
    });

    expect(finishOcpPostCallAppeal).toHaveBeenCalledTimes(1);
    expect(result.current.finishAppeal.submitting).toBe(false);
  });

  it("marks reserved break as current in dropdown during post-call processing", () => {
    setAuthenticatedReady();
    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.POST_CALL_PROCESSING,
        isBusy: true,
        reasonId: 5,
        reservedStatus: OperatorStatus.BREAK,
        reservedReasonId: 7,
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

    expect(
      result.current.vm.breakItems.find((item) => item.reasonId === 7)?.isCurrent,
    ).toBe(true);
    expect(
      result.current.vm.breakItems.find((item) => item.reasonId === 11)?.isCurrent,
    ).toBe(false);
  });

  it("keeps finish appeal available after reserve notify throws", async () => {
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
      value: { kind: "reserved", targetStatus: "break", reasonId: 7 },
    });
    const facade = {
      changeOcpOperatorStatus,
      finishOcpPostCallAppeal: vi.fn(),
      connectOcp: vi.fn(),
    };
    const notify = vi.fn(() => {
      throw new TypeError("Cannot read properties of undefined (reading 'reason')");
    });
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
    expect(result.current.finishAppeal.visible).toBe(true);
  });

  it("falls back to system status label while ringing and talking", () => {
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
    expect(result.current.vm.allowStatusLabelFallback).toBe(false);

    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.RINGING,
        reasonId: 0,
        isBusy: true,
      },
    });
    rerender();
    expect(result.current.vm.reasonLabel).toBe("");
    expect(result.current.vm.allowStatusLabelFallback).toBe(true);
    expect(result.current.vm.statusLabelKey).toBe("ocp.operatorStatus.ringing");

    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.TALKING,
        reasonId: 0,
        isBusy: true,
      },
    });
    rerender();
    expect(result.current.vm.reasonLabel).toBe("");
    expect(result.current.vm.allowStatusLabelFallback).toBe(true);
    expect(result.current.vm.statusLabelKey).toBe("ocp.operatorStatus.talking");
  });

  it("falls back to Available status label when Ready has no matching reason", () => {
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
        breakReasons: [],
        logoutReasons: [],
      },
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.READY,
        reasonId: 0,
        isBusy: false,
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
    expect(result.current.vm.reasonLabel).toBe("");
    expect(result.current.vm.allowStatusLabelFallback).toBe(true);
    expect(result.current.vm.statusLabelKey).toBe("ocp.operatorStatus.ready");
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

  it("marks no option current for Preparing / Ringing / unmatched Ready reasonId", () => {
    setAuthenticatedReady();

    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.PREPARING_TO_WORK,
        reasonId: 0,
      },
    });
    const preparing = renderHook(() =>
      useOperatorStatusSelector({
        facade: null,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );
    expect(preparing.result.current.vm.readyItems.every((item) => !item.isCurrent)).toBe(
      true,
    );
    expect(preparing.result.current.vm.breakItems.every((item) => !item.isCurrent)).toBe(
      true,
    );
    preparing.unmount();

    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.RINGING,
        reasonId: 0,
      },
    });
    const ringing = renderHook(() =>
      useOperatorStatusSelector({
        facade: null,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );
    expect(ringing.result.current.vm.readyItems.every((item) => !item.isCurrent)).toBe(
      true,
    );
    expect(ringing.result.current.vm.breakItems.every((item) => !item.isCurrent)).toBe(
      true,
    );
    ringing.unmount();

    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.READY,
        reasonId: 0,
      },
    });
    const unmatchedReady = renderHook(() =>
      useOperatorStatusSelector({
        facade: null,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );
    expect(
      unmatchedReady.result.current.vm.readyItems.every((item) => !item.isCurrent),
    ).toBe(true);
  });

  it("marks Ready option current only when status READY and reasonId matches", () => {
    setAuthenticatedReady();
    const { result } = renderHook(() =>
      useOperatorStatusSelector({
        facade: null,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );

    expect(result.current.vm.readyItems).toEqual([
      expect.objectContaining({ reasonId: 1, isCurrent: true }),
    ]);
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

    expect(result.current.vm.breakItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reasonId: 7,
          targetStatus: "break",
          isCurrent: true,
        }),
        expect.objectContaining({
          reasonId: 11,
          targetStatus: "break",
          isCurrent: false,
        }),
      ]),
    );
    expect(result.current.vm.breakItems.map((item) => item.reasonId)).toEqual([7, 11]);

    act(() => {
      result.current.onSelectReason("break", 11);
    });

    expect(changeOcpOperatorStatus).toHaveBeenCalledWith({
      targetStatus: "break",
      reasonId: 11,
      intent: "auto",
    });
  });

  it("keeps chip label from server projection until users entity updates", async () => {
    setAuthenticatedReady();
    const changeOcpOperatorStatus = vi.fn().mockResolvedValue({
      ok: true,
      value: { kind: "applied", targetStatus: "break", reasonId: 7 },
    });
    const facade = {
      changeOcpOperatorStatus,
      connectOcp: vi.fn(),
    };
    const { result, rerender } = renderHook(() =>
      useOperatorStatusSelector({
        facade: facade as never,
        isSipRegistered: true,
        dndEnabled: false,
        onOpenIntegrationsSettings: vi.fn(),
      }),
    );
    expect(result.current.vm.reasonLabel).toBe("Ready");

    await act(async () => {
      result.current.onSelectReason("break", 7);
      await Promise.resolve();
    });

    expect(result.current.vm.reasonLabel).toBe("Ready");

    useAccountBootstrapStore.setState({
      ocpOperatorStatusProjection: {
        ...useAccountBootstrapStore.getState().ocpOperatorStatusProjection,
        status: OperatorStatus.BREAK,
        reasonId: 7,
        isBusy: false,
      },
    });
    rerender();
    expect(result.current.vm.reasonLabel).toBe("Toilet break");
  });

  it("lists ready reasons then break reasons without pinning current aside", () => {
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

    expect(result.current.vm.readyItems.map((item) => item.reasonId)).toEqual([1, 3]);
    expect(result.current.vm.readyItems[0]?.isCurrent).toBe(true);
    expect(result.current.vm.breakItems.map((item) => item.reasonId)).toEqual([7]);
  });
});
