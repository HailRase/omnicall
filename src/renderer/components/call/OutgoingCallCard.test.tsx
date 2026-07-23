// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OutgoingCallCard } from "./OutgoingCallCard.js";

afterEach(() => {
  cleanup();
});

describe("OutgoingCallCard", () => {
  it("shows connecting status with localized label", () => {
    render(
      <OutgoingCallCard
        callId="call-1"
        callState="Connecting"
        uiState="calling"
        toneIndicator="none"
        numberValue="+12025550147"
        lastError={null}
        lastDtmfTone={null}
      />,
    );

    expect(screen.getByTestId("call-state-label")).toHaveTextContent("Соединение");
    expect(screen.queryByTestId("call-failed-alert")).not.toBeInTheDocument();
  });

  it("shows ringback tone label while connecting", () => {
    render(
      <OutgoingCallCard
        callId="call-1"
        callState="Connecting"
        uiState="progress"
        toneIndicator="ringback"
        numberValue="+12025550147"
        lastError={null}
        lastDtmfTone={null}
      />,
    );

    expect(screen.getByTestId("call-state-label")).toHaveTextContent("Гудки");
  });
});
