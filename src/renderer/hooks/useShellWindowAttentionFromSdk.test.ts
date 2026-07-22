// @vitest-environment jsdom
/**
 * Unit tests for SDK attention shell hook.
 */

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { SdkActivateConsentPending } from "@application/integration/DeferredSdkActivateConsent.js";
import type { ShellOperatorAttentionPayload } from "@shared/ipc/ShellWindowRaiseContract.js";
import { useShellWindowAttentionFromSdk } from "./useShellWindowAttentionFromSdk.js";

describe("useShellWindowAttentionFromSdk", () => {
  it("raises once when activate consent becomes pending", () => {
    const raiseWindow = vi.fn().mockResolvedValue({ ok: true });
    const pending: SdkActivateConsentPending = {
      kind: "activate",
      origin: "https://crm.example",
      login: "1001",
      profileLabel: "Agent",
      availableModes: ["sip_only"],
    };

    const { rerender } = renderHook(
      (props: { activateConsentPending: SdkActivateConsentPending | null }) =>
        useShellWindowAttentionFromSdk({
          activateConsentPending: props.activateConsentPending,
          raiseWindow,
          onOperatorAttention: () => () => undefined,
        }),
      { initialProps: { activateConsentPending: pending } },
    );

    expect(raiseWindow).toHaveBeenCalledWith({
      reason: "sdk_activate_consent",
      dedupeKey: "https://crm.example:Agent",
    });
    rerender({ activateConsentPending: pending });
    expect(raiseWindow).toHaveBeenCalledTimes(1);
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
