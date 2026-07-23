// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SdkActivateConsentPending } from "@application/integration/DeferredSdkActivateConsent.js";
import { SdkActivateProfileConsentModal } from "./SdkActivateProfileConsentModal.js";

afterEach(cleanup);

const activatePending: SdkActivateConsentPending = {
  kind: "activate",
  origin: "https://crm.example",
  login: "1001",
  profileLabel: "Agent 1001",
  availableModes: ["sip_only", "ocp"],
  attentionId: "att_test_1",
  expiresAt: new Date(Date.now() + 120_000).toISOString(),
};

describe("SdkActivateProfileConsentModal", () => {
  it("shows cancel + allow with deny in the cancel dropdown", async () => {
    const onAllow = vi.fn();
    const onDeny = vi.fn();
    const onDismiss = vi.fn();
    render(
      <SdkActivateProfileConsentModal
        pending={activatePending}
        onAllow={onAllow}
        onDeny={onDeny}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByTestId("sdk-activate-consent-cancel")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-activate-consent-allow")).toBeInTheDocument();
    expect(screen.getByTestId("sdk-activate-consent-deadline")).toBeInTheDocument();
    expect(screen.queryByTestId("sdk-activate-consent-deny")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("sdk-activate-consent-more"));
    await userEvent.click(screen.getByTestId("sdk-activate-consent-deny"));
    expect(onDeny).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByTestId("sdk-activate-consent-cancel"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("allows with the selected mode", async () => {
    const onAllow = vi.fn();
    render(
      <SdkActivateProfileConsentModal
        pending={activatePending}
        onAllow={onAllow}
        onDeny={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByTestId("sdk-activate-mode-ocp"));
    await userEvent.click(screen.getByTestId("sdk-activate-consent-allow"));
    expect(onAllow).toHaveBeenCalledWith("ocp");
  });
});
