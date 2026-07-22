// @vitest-environment jsdom
/**
 * Unit tests for SDK attention shell hook.
 */

import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { SdkActivateConsentPending } from "@application/integration/DeferredSdkActivateConsent.js";
import type { ShellOperatorAttentionPayload } from "@shared/ipc/ShellWindowRaiseContract.js";
import { useShellWindowAttentionFromSdk } from "./useShellWindowAttentionFromSdk.js";

function pending(
  overrides: Partial<SdkActivateConsentPending> = {},
): SdkActivateConsentPending {
  return {
    kind: "activate",
    origin: "https://crm.example",
    login: "1001",
    profileLabel: "Agent",
    availableModes: ["sip_only"],
    attentionId: "att_1",
    ...overrides,
  };
}

describe("useShellWindowAttentionFromSdk", () => {
  it("raises once when activate consent becomes pending", () => {
    const raiseWindow = vi.fn().mockResolvedValue({ ok: true });
    const first = pending({ attentionId: "att_1" });

    const { rerender } = renderHook(
      (props: { activateConsentPending: SdkActivateConsentPending | null }) =>
        useShellWindowAttentionFromSdk({
          activateConsentPending: props.activateConsentPending,
          raiseWindow,
          onOperatorAttention: () => () => undefined,
        }),
      { initialProps: { activateConsentPending: first } },
    );

    expect(raiseWindow).toHaveBeenCalledWith({
      reason: "sdk_activate_consent",
      dedupeKey: "att_1",
    });
    rerender({ activateConsentPending: first });
    expect(raiseWindow).toHaveBeenCalledTimes(1);
  });

  it("raises again for a new consent episode with the same origin and profile", () => {
    const raiseWindow = vi.fn().mockResolvedValue({ ok: true });
    const { rerender } = renderHook(
      (props: { activateConsentPending: SdkActivateConsentPending | null }) =>
        useShellWindowAttentionFromSdk({
          activateConsentPending: props.activateConsentPending,
          raiseWindow,
          onOperatorAttention: () => () => undefined,
        }),
      {
        initialProps: {
          activateConsentPending: pending({ attentionId: "att_1" }),
        },
      },
    );

    expect(raiseWindow).toHaveBeenCalledTimes(1);

    act(() => {
      rerender({ activateConsentPending: null });
    });
    act(() => {
      rerender({
        activateConsentPending: pending({ attentionId: "att_2" }),
      });
    });

    expect(raiseWindow).toHaveBeenCalledTimes(2);
    expect(raiseWindow).toHaveBeenLastCalledWith({
      reason: "sdk_activate_consent",
      dedupeKey: "att_2",
    });
  });

  it("refreshes SDK snapshot on pairing attention without opening Settings", () => {
    const refreshSdkSnapshot = vi.fn();
    const handlers: Array<(payload: ShellOperatorAttentionPayload) => void> = [];

    renderHook(() =>
      useShellWindowAttentionFromSdk({
        activateConsentPending: null,
        refreshSdkSnapshot,
        raiseWindow: () => Promise.resolve({ ok: true }),
        onOperatorAttention: (handler) => {
          handlers.push(handler);
          return () => undefined;
        },
      }),
    );

    expect(handlers).toHaveLength(1);
    handlers[0]!({ kind: "sdk_pairing" });
    expect(refreshSdkSnapshot).toHaveBeenCalledTimes(1);
  });
});
