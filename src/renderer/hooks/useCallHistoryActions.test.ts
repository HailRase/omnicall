// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import { useCallHistoryActions } from "./useCallHistoryActions.js";

type RedialResult = Awaited<ReturnType<AccountBootstrapFacade["redialFromHistory"]>>;

function createFacadeMock(
  redialFromHistory: AccountBootstrapFacade["redialFromHistory"],
): AccountBootstrapFacade {
  return {
    listCallHistory: vi.fn(),
    redialFromHistory,
  } as unknown as AccountBootstrapFacade;
}

describe("useCallHistoryActions", () => {
  it("notifies and returns error when redial fails", async () => {
    const notify = vi.fn();
    const facade = createFacadeMock(
      vi.fn().mockResolvedValue(
        err(createPlatformError("validation_failed", "Invalid phone number")),
      ),
    );

    const { result } = renderHook(() =>
      useCallHistoryActions({
        facade,
        notify,
      }),
    );

    const redialResult = await result.current.redialEntry("entry-1");

    expect(redialResult.ok).toBe(false);
    expect(notify).toHaveBeenCalledWith({
      level: "error",
      messageKey: "history.error.redialFailed",
      module: "history",
      functionId: "history.redial",
      interruptClass: "actionable",
    });
  });

  it("returns success without notification when redial succeeds", async () => {
    const notify = vi.fn();
    const successResult = ok({ id: "call-1" }) as RedialResult;
    const facade = createFacadeMock(vi.fn().mockResolvedValue(successResult));

    const { result } = renderHook(() =>
      useCallHistoryActions({
        facade,
        notify,
      }),
    );

    const redialResult = await result.current.redialEntry("entry-1");

    expect(redialResult.ok).toBe(true);
    expect(notify).not.toHaveBeenCalled();
  });
});
