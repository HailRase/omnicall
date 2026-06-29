// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryDomainEventBus } from "@application/events/InMemoryDomainEventBus.js";
import { TRANSFER_SUCCESS_CELEBRATION_TTL_MS } from "@application/index.js";
import type { DomainEventPublisher } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { useTransferSuccessCelebration } from "./useTransferSuccessCelebration.js";

function publishTransferSuccessEvent(
  eventPublisher: DomainEventPublisher,
  type: "CallTransferred" | "AttendedTransferCompleted",
): void {
  const correlationId = createCorrelationId();
  const occurredAt = new Date().toISOString();

  if (type === "CallTransferred") {
    eventPublisher.publish({
      type,
      correlationId,
      occurredAt,
      callId: "call-1",
      targetNumber: "+12025550100",
      transferType: "blind",
    });
    return;
  }

  eventPublisher.publish({
    type,
    correlationId,
    occurredAt,
    sourceCallId: "src-1",
    consultationCallId: "consult-1",
  });
}

describe("useTransferSuccessCelebration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows celebration on blind transfer success event", () => {
    const eventPublisher = new InMemoryDomainEventBus();
    const { result } = renderHook(() =>
      useTransferSuccessCelebration({
        eventPublisher,
        incomingCallVisible: false,
      }),
    );

    act(() => {
      publishTransferSuccessEvent(eventPublisher, "CallTransferred");
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.exiting).toBe(false);
  });

  it("auto-dismisses after ttl and exit animation", () => {
    const eventPublisher = new InMemoryDomainEventBus();
    const { result } = renderHook(() =>
      useTransferSuccessCelebration({
        eventPublisher,
        incomingCallVisible: false,
      }),
    );

    act(() => {
      publishTransferSuccessEvent(eventPublisher, "AttendedTransferCompleted");
    });

    act(() => {
      vi.advanceTimersByTime(TRANSFER_SUCCESS_CELEBRATION_TTL_MS);
    });

    expect(result.current.exiting).toBe(true);

    act(() => {
      vi.advanceTimersByTime(280);
    });

    expect(result.current.visible).toBe(false);
    expect(result.current.exiting).toBe(false);
  });

  it("dismisses early when incoming call appears", () => {
    const eventPublisher = new InMemoryDomainEventBus();
    const { result, rerender } = renderHook(
      (props: { incomingCallVisible: boolean }) =>
        useTransferSuccessCelebration({
          eventPublisher,
          incomingCallVisible: props.incomingCallVisible,
        }),
      { initialProps: { incomingCallVisible: false } },
    );

    act(() => {
      publishTransferSuccessEvent(eventPublisher, "CallTransferred");
    });

    rerender({ incomingCallVisible: true });

    expect(result.current.exiting).toBe(true);
  });

  it("dismisses on manual dismiss", () => {
    const eventPublisher = new InMemoryDomainEventBus();
    const { result } = renderHook(() =>
      useTransferSuccessCelebration({
        eventPublisher,
        incomingCallVisible: false,
      }),
    );

    act(() => {
      publishTransferSuccessEvent(eventPublisher, "CallTransferred");
    });

    act(() => {
      result.current.dismissCelebration();
    });

    expect(result.current.exiting).toBe(true);

    act(() => {
      vi.advanceTimersByTime(280);
    });

    expect(result.current.visible).toBe(false);
  });
});
