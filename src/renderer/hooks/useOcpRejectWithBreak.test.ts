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
import { ok, err } from "@shared/result/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useOcpRejectWithBreak } from "./useOcpRejectWithBreak.js";

afterEach(() => {
  cleanup();
  useAccountBootstrapStore.setState({
    ocpSessionProjection: initialOcpSessionProjection(),
    ocpOperatorStatusProjection: initialOperatorStatusProjection(),
    ocpReasonsProjection: initialOcpReasonsProjection(),
  });
});

function createFacade(reserveOcpPostCallStatus?: ReturnType<typeof vi.fn>): never {
  return {
    reserveOcpPostCallStatus:
      reserveOcpPostCallStatus ?? vi.fn().mockResolvedValue(ok(undefined)),
  } as never;
}

describe("useOcpRejectWithBreak", () => {
  it("keeps choice disabled when OCP is not authenticated", () => {
    const { result } = renderHook(() =>
      useOcpRejectWithBreak({
        facade: createFacade(),
        callId: "call-1",
        rejectIncoming: vi.fn(),
        rejectIncomingWithBreakReason: vi.fn(),
      }),
    );

    expect(result.current.rejectChoiceEnabled).toBe(false);
  });

  it("enables choice when authenticated with break reasons", () => {
    useAccountBootstrapStore.setState({
      ocpSessionProjection: {
        ...initialOcpSessionProjection(),
        isAuthenticated: true,
        connectionState: "authenticated",
      },
      ocpReasonsProjection: {
        ...initialOcpReasonsProjection(),
        breakReasons: [
          {
            id: 7,
            parentStatus: OperatorStatus.BREAK,
            defaultDescription: "Coffee",
          },
        ],
      },
    });

    const { result } = renderHook(() =>
      useOcpRejectWithBreak({
        facade: createFacade(),
        callId: "call-1",
        rejectIncoming: vi.fn(),
        rejectIncomingWithBreakReason: vi.fn(),
      }),
    );

    expect(result.current.rejectChoiceEnabled).toBe(true);
  });

  it("rejects without break immediately", () => {
    const rejectIncoming = vi.fn();
    const { result } = renderHook(() =>
      useOcpRejectWithBreak({
        facade: createFacade(),
        callId: "call-1",
        rejectIncoming,
        rejectIncomingWithBreakReason: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleRejectWithoutBreak();
    });

    expect(rejectIncoming).toHaveBeenCalledTimes(1);
  });

  it("opens modal then rejects and reserves on confirm", async () => {
    useAccountBootstrapStore.setState({
      ocpSessionProjection: {
        ...initialOcpSessionProjection(),
        isAuthenticated: true,
        connectionState: "authenticated",
      },
      ocpOperatorStatusProjection: {
        ...initialOperatorStatusProjection(),
        operatorId: 42,
      },
      ocpReasonsProjection: {
        ...initialOcpReasonsProjection(),
        breakReasons: [
          {
            id: 7,
            parentStatus: OperatorStatus.BREAK,
            defaultDescription: "Coffee",
          },
        ],
      },
    });

    const reserveExecute = vi.fn().mockResolvedValue(ok(undefined));
    const rejectIncomingWithBreakReason = vi.fn().mockResolvedValue(true);

    const { result } = renderHook(() =>
      useOcpRejectWithBreak({
        facade: createFacade(reserveExecute),
        callId: "call-1",
        rejectIncoming: vi.fn(),
        rejectIncomingWithBreakReason,
      }),
    );

    act(() => {
      result.current.handleRequestRejectWithBreak();
    });
    expect(result.current.modalOpen).toBe(true);

    act(() => {
      result.current.handleSelectReason(7);
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(rejectIncomingWithBreakReason).toHaveBeenCalledWith("Coffee");
    expect(reserveExecute).toHaveBeenCalledWith({
      operatorId: 42,
      targetStatus: "break",
      reasonId: 7,
    });
    expect(result.current.modalOpen).toBe(false);
  });

  it("notifies when reject fails and keeps modal open", async () => {
    useAccountBootstrapStore.setState({
      ocpSessionProjection: {
        ...initialOcpSessionProjection(),
        isAuthenticated: true,
        connectionState: "authenticated",
      },
      ocpOperatorStatusProjection: {
        ...initialOperatorStatusProjection(),
        operatorId: 42,
      },
      ocpReasonsProjection: {
        ...initialOcpReasonsProjection(),
        breakReasons: [
          {
            id: 7,
            parentStatus: OperatorStatus.BREAK,
            defaultDescription: "Coffee",
          },
        ],
      },
    });

    const notify = vi.fn();
    const { result } = renderHook(() =>
      useOcpRejectWithBreak({
        facade: createFacade(),
        callId: "call-1",
        rejectIncoming: vi.fn(),
        rejectIncomingWithBreakReason: vi.fn().mockResolvedValue(false),
        notify,
      }),
    );

    act(() => {
      result.current.handleRequestRejectWithBreak();
      result.current.handleSelectReason(7);
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(notify).toHaveBeenCalledWith({
      level: "error",
      messageKey: "ocp.incomingCall.breakModal.rejectError",
      module: "ocp",
      functionId: "ocp.incoming.reject_with_break",
      interruptClass: "actionable",
    });
    expect(result.current.modalOpen).toBe(true);
    expect(result.current.submitting).toBe(false);
  });

  it("notifies when reserve fails after reject", async () => {
    useAccountBootstrapStore.setState({
      ocpSessionProjection: {
        ...initialOcpSessionProjection(),
        isAuthenticated: true,
        connectionState: "authenticated",
      },
      ocpOperatorStatusProjection: {
        ...initialOperatorStatusProjection(),
        operatorId: 42,
      },
      ocpReasonsProjection: {
        ...initialOcpReasonsProjection(),
        breakReasons: [
          {
            id: 7,
            parentStatus: OperatorStatus.BREAK,
            defaultDescription: "Coffee",
          },
        ],
      },
    });

    const notify = vi.fn();
    const reserveExecute = vi
      .fn()
      .mockResolvedValue(err(createPlatformError("operation_failed", "fail")));

    const { result } = renderHook(() =>
      useOcpRejectWithBreak({
        facade: createFacade(reserveExecute),
        callId: "call-1",
        rejectIncoming: vi.fn(),
        rejectIncomingWithBreakReason: vi.fn().mockResolvedValue(true),
        notify,
      }),
    );

    act(() => {
      result.current.handleRequestRejectWithBreak();
      result.current.handleSelectReason(7);
    });

    await act(async () => {
      await result.current.handleConfirm();
    });

    expect(notify).toHaveBeenCalledWith({
      level: "error",
      messageKey: "ocp.incomingCall.breakModal.reserveError",
      module: "ocp",
      functionId: "ocp.status.reserve",
      interruptClass: "actionable",
    });
  });
});
