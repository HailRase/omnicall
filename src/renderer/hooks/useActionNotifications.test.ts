// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ActiveCallControlsProjection } from "@application/index.js";
import { useActionNotifications } from "./useActionNotifications.js";

type HookInput = Parameters<typeof useActionNotifications>[0];

function createCallControlsProjection(
  overrides: Partial<ActiveCallControlsProjection> = {},
): ActiveCallControlsProjection {
  return {
    callId: null,
    callState: "Idle",
    muted: false,
    holdDisabledReason: "no_active_call",
    resumeDisabledReason: "no_active_call",
    muteDisabledReason: "no_active_call",
    unmuteDisabledReason: "no_active_call",
    hangupDisabledReason: "no_active_call",
    lastOperationError: null,
    ...overrides,
  };
}

function createBaseInput(overrides: Partial<HookInput> = {}): HookInput {
  const notify = vi.fn();
  return {
    notifications: { notify },
    accountFeedback: {
      error: null,
      successKey: null,
      warningKey: null,
    },
    callControls: {
      projection: createCallControlsProjection(),
      onRetry: vi.fn(),
    },
    dtmfError: null,
    transferFailure: null,
    logoutErrorMessage: null,
    settingsUpdateError: null,
    sipActionSuccessKey: null,
    sipActionErrorText: null,
    statusRejectionBanner: null,
    ocpToasts: [],
    ...overrides,
  };
}

describe("useActionNotifications", () => {
  it("emits account success once for stable unchanged state", () => {
    const input = createBaseInput({
      accountFeedback: {
        error: null,
        successKey: "account.success.authorizationSucceeded",
        warningKey: null,
      },
    });
    const { rerender } = renderHook((props: HookInput) => useActionNotifications(props), {
      initialProps: input,
    });

    rerender({
      ...input,
      accountFeedback: {
        ...input.accountFeedback,
      },
    });

    expect(input.notifications.notify).toHaveBeenCalledTimes(1);
  });

  it("keeps stable warning and error state from re-emitting", () => {
    const input = createBaseInput({
      accountFeedback: {
        successKey: null,
        warningKey: "account.warning.profileSaveFailed",
        error: {
          key: "account.error.serverRegistration",
          params: { detail: "503" },
        },
      },
    });
    const { rerender } = renderHook((props: HookInput) => useActionNotifications(props), {
      initialProps: input,
    });

    rerender({
      ...input,
      accountFeedback: {
        ...input.accountFeedback,
      },
    });

    expect(input.notifications.notify).toHaveBeenCalledTimes(2);
  });

  it("emits call operation error for each operation attempt", () => {
    const onRetry = vi.fn();
    const input = createBaseInput({
      callControls: {
        projection: createCallControlsProjection({
          callId: "call-1",
          callState: "Active",
          lastOperationError: {
            operation: "hold",
            message: "failed",
          },
        }),
        onRetry,
      },
    });
    const { rerender } = renderHook((props: HookInput) => useActionNotifications(props), {
      initialProps: input,
    });

    rerender({
      ...input,
      callControls: {
        ...input.callControls,
        projection: createCallControlsProjection({
          callId: "call-1",
          callState: "Active",
          lastOperationError: {
            operation: "hold",
            message: "failed",
          },
        }),
      },
    });
    expect(input.notifications.notify).toHaveBeenCalledTimes(2);

    rerender({
      ...input,
      callControls: {
        ...input.callControls,
        projection: createCallControlsProjection({
          callId: "call-1",
          callState: "Active",
          lastOperationError: null,
        }),
      },
    });
    rerender({
      ...input,
      callControls: {
        ...input.callControls,
        projection: createCallControlsProjection({
          callId: "call-1",
          callState: "Active",
          lastOperationError: {
            operation: "hold",
            message: "failed",
          },
        }),
      },
    });

    expect(input.notifications.notify).toHaveBeenCalledTimes(3);
  });

  it("deduplicates dtmf, logout, settings, sip success and sip error states", () => {
    const input = createBaseInput({
      dtmfError: "dtmf failed",
      logoutErrorMessage: "logout failed",
      settingsUpdateError: "settings failed",
      sipActionSuccessKey: "account.success.authorizationSucceeded",
      sipActionErrorText: "sip action failed",
    });
    const { rerender } = renderHook((props: HookInput) => useActionNotifications(props), {
      initialProps: input,
    });

    rerender({
      ...input,
      notifications: { ...input.notifications },
      callControls: { ...input.callControls },
    });

    expect(input.notifications.notify).toHaveBeenCalledTimes(5);
  });
});
