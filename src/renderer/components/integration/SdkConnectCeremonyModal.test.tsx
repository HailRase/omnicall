// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setRendererLanguage } from "../../i18n/index.js";
import { setupJsdomRadix } from "../../test/setupJsdomRadix.js";
import { SdkConnectCeremonyModal } from "./SdkConnectCeremonyModal.js";
import type { SdkConnectCeremonyView } from "../../hooks/useSdkConnectCeremony.js";

beforeEach(() => {
  setupJsdomRadix();
  setRendererLanguage("en");
});

afterEach(() => {
  cleanup();
  setRendererLanguage("ru");
});

function transportView(): SdkConnectCeremonyView {
  return {
    open: true,
    step: "transport",
    origin: "https://crm.example",
    showStepper: true,
    originTrustRequestId: "trust_1",
    pairing: null,
  };
}

function pairingView(showStepper: boolean): SdkConnectCeremonyView {
  return {
    open: true,
    step: "pairing",
    origin: "https://crm.example",
    showStepper,
    originTrustRequestId: null,
    pairing: {
      pairingRequestId: "pair_1",
      clientId: "cli_1",
      origin: "https://crm.example",
      applicationName: "CRM Tab",
      profile: "presentation",
      expiresAt: "2026-07-22T12:00:00.000Z",
    },
  };
}

const idleHandlers = {
  onAllowTransport: () => undefined,
  onDenyTransport: () => undefined,
  onApprovePairing: () => undefined,
  onDenyPairing: () => undefined,
  onCancelWaiting: () => undefined,
  onDismiss: () => undefined,
};

describe("SdkConnectCeremonyModal", () => {
  it("renders transport step with stepper and allow/deny", async () => {
    const user = userEvent.setup();
    const onAllowTransport = vi.fn();
    const onDenyTransport = vi.fn();
    render(
      <SdkConnectCeremonyModal
        view={transportView()}
        busy={false}
        {...idleHandlers}
        onAllowTransport={onAllowTransport}
        onDenyTransport={onDenyTransport}
      />,
    );

    expect(screen.getByTestId("sdk-connect-ceremony-modal")).toBeInTheDocument();
    expect(screen.getByText("Connection")).toBeInTheDocument();
    expect(screen.getByText("Pairing")).toBeInTheDocument();
    await user.click(screen.getByTestId("sdk-connect-ceremony-allow-transport"));
    expect(onAllowTransport).toHaveBeenCalledTimes(1);
    await user.click(screen.getByTestId("sdk-connect-ceremony-deny-transport"));
    expect(onDenyTransport).toHaveBeenCalledTimes(1);
  });

  it("renders pairing-only without stepper when origin already trusted", async () => {
    const user = userEvent.setup();
    const onApprovePairing = vi.fn();
    render(
      <SdkConnectCeremonyModal
        view={pairingView(false)}
        busy={false}
        {...idleHandlers}
        onApprovePairing={onApprovePairing}
      />,
    );

    expect(screen.queryByText("Connection")).not.toBeInTheDocument();
    expect(screen.getByTestId("sdk-connect-ceremony-pairing-meta")).toBeInTheDocument();
    await user.click(screen.getByTestId("sdk-connect-ceremony-approve-pair_1"));
    expect(onApprovePairing).toHaveBeenCalledTimes(1);
  });

  it("shows waiting pulse and cancel button calls onCancelWaiting", async () => {
    const user = userEvent.setup();
    const onCancelWaiting = vi.fn();
    const onDenyPairing = vi.fn();
    render(
      <SdkConnectCeremonyModal
        view={{
          open: true,
          step: "waiting",
          origin: "https://crm.example",
          showStepper: true,
          originTrustRequestId: null,
          pairing: null,
        }}
        busy={false}
        {...idleHandlers}
        onCancelWaiting={onCancelWaiting}
        onDenyPairing={onDenyPairing}
      />,
    );

    expect(screen.getByTestId("sdk-connect-ceremony-waiting")).toBeInTheDocument();
    expect(screen.queryByTestId("sdk-connect-ceremony-allow-transport")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("sdk-connect-ceremony-cancel-waiting"));
    expect(onCancelWaiting).toHaveBeenCalledTimes(1);
    expect(onDenyPairing).not.toHaveBeenCalled();
  });
});
