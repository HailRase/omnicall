// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TRANSFER_FAILURE_BANNER_TTL_MS,
  useTransferFailureBanner,
} from "./useTransferFailureBanner.js";

describe("useTransferFailureBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows failure message and hides after ttl", () => {
    const { result, rerender } = renderHook(
      (props: { failureMessage: string | null; failureKey: string | null }) =>
        useTransferFailureBanner({
          failureMessage: props.failureMessage,
          failureKey: props.failureKey,
          transferInProgress: false,
        }),
      {
        initialProps: {
          failureMessage: "busy",
          failureKey: "busy|transfer_failed",
        },
      },
    );

    expect(result.current.failureBannerMessage).toBe("busy");

    act(() => {
      vi.advanceTimersByTime(TRANSFER_FAILURE_BANNER_TTL_MS);
    });

    expect(result.current.failureBannerMessage).toBeNull();

    rerender({
      failureMessage: "busy",
      failureKey: "busy|transfer_failed",
    });
    expect(result.current.failureBannerMessage).toBeNull();
  });

  it("restarts ttl when a new failure key arrives", () => {
    const { result, rerender } = renderHook(
      (props: { failureMessage: string | null; failureKey: string | null }) =>
        useTransferFailureBanner({
          failureMessage: props.failureMessage,
          failureKey: props.failureKey,
          transferInProgress: false,
        }),
      {
        initialProps: {
          failureMessage: "busy",
          failureKey: "busy|transfer_failed",
        },
      },
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    rerender({
      failureMessage: "rejected",
      failureKey: "rejected|transfer_failed",
    });

    expect(result.current.failureBannerMessage).toBe("rejected");

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.failureBannerMessage).toBe("rejected");

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.failureBannerMessage).toBeNull();
  });

  it("dismisses immediately on manual dismiss", () => {
    const { result } = renderHook(() =>
      useTransferFailureBanner({
        failureMessage: "busy",
        failureKey: "busy|transfer_failed",
        transferInProgress: false,
      }),
    );

    act(() => {
      result.current.dismissFailureBanner();
    });

    expect(result.current.failureBannerMessage).toBeNull();
  });
});
