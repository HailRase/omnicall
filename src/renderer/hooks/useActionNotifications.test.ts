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
    outgoingFailure: null,
    dtmfError: null,
    transferFailure: null,
    logoutErrorMessage: null,
    settingsUpdateError: null,
    sipActionSuccessKey: null,
    sipActionErrorText: null,
    headsetFault: {
      reason: null,
      occurredAt: null,
    },
    ...overrides,
  };
}

describe("useActionNotifications", () => {
  it("emits account success once for stable unchanged state", () => {
    const input = createBaseInput({
      accountFeedback: {
        error: null,
        successKey: "account.success.sipRegistrationSucceeded",
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

  it("emits staged SIP transport and registration success keys", () => {
    const input = createBaseInput({
      accountFeedback: {
        error: null,
        successKeys: [
          "account.success.sipTransportConnected",
          "account.success.sipRegistrationSucceeded",
        ],
        warningKey: null,
      },
    });
    renderHook(() => useActionNotifications(input));

    expect(input.notifications.notify).toHaveBeenCalledTimes(2);
    expect(input.notifications.notify).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        messageKey: "account.success.sipTransportConnected",
      }),
    );
    expect(input.notifications.notify).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        messageKey: "account.success.sipRegistrationSucceeded",
      }),
    );
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

  it("attaches System State action on the error toast when requested", () => {
    const onOpenSystemState = vi.fn();
    const input = createBaseInput({
      accountFeedback: {
        successKey: null,
        warningKey: null,
        error: { key: "account.error.authorizationFailed" },
        openSystemStateAction: true,
      },
      onOpenSystemState,
    });
    const { rerender } = renderHook((props: HookInput) => useActionNotifications(props), {
      initialProps: input,
    });

    rerender({
      ...input,
      onOpenSystemState: vi.fn(),
    });

    expect(input.notifications.notify).toHaveBeenCalledTimes(1);
    expect(input.notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        messageKey: "account.error.authorizationFailed",
        action: expect.objectContaining({
          labelKey: "account.notification.openSystemStateAction",
        }),
      }),
    );
  });

  it("does not attach System State action for validation errors", () => {
    const notify = vi.fn();
    const input = createBaseInput({
      notifications: { notify },
      accountFeedback: {
        successKey: null,
        warningKey: null,
        error: { key: "account.error.validationFailed" },
        openSystemStateAction: false,
      },
      onOpenSystemState: vi.fn(),
    });
    renderHook(() => useActionNotifications(input));

    const descriptor = notify.mock.calls[0]?.[0] as {
      messageKey: string;
      action?: unknown;
    };
    expect(descriptor.messageKey).toBe("account.error.validationFailed");
    expect(descriptor.action).toBeUndefined();
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
          lastOperationError: {
            operation: "hold",
            message: "failed again",
          },
        }),
      },
    });
    expect(input.notifications.notify).toHaveBeenCalledTimes(3);
  });

  it("emits sip recovery success", () => {
    const input = createBaseInput({
      sipActionSuccessKey: "account.success.sipRegistrationSucceeded",
    });
    renderHook(() => useActionNotifications(input));

    expect(input.notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        messageKey: "account.success.sipRegistrationSucceeded",
        functionId: "sip.recovery",
      }),
    );
  });

  it("emits localized outgoing failure notification once per episode", () => {
    const input = createBaseInput({
      outgoingFailure: {
        reason: "busy",
        callId: "call-1",
        occurredAt: "2026-07-23T12:00:00.000Z",
      },
    });
    const { rerender } = renderHook((props: HookInput) => useActionNotifications(props), {
      initialProps: input,
    });

    rerender({ ...input });

    expect(input.notifications.notify).toHaveBeenCalledTimes(1);
    expect(input.notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        messageKey: "notification.outgoing.failed.busy",
        functionId: "call.outgoing",
      }),
    );
  });
});
