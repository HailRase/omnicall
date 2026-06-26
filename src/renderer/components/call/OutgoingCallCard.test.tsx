// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OutgoingCallCard } from "./OutgoingCallCard.js";

describe("OutgoingCallCard", () => {
  it("shows failed state and error message", () => {
    render(
      <OutgoingCallCard
        callId="call-1"
        callState="Failed"
        uiState="failedBusy"
        toneIndicator="busy"
        numberValue="+12025550147"
        lastError="Busy"
        lastDtmfTone={null}
      />,
    );

    expect(screen.getByTestId("call-state-label")).toHaveTextContent("Занято");
    expect(screen.getByTestId("call-failed-alert")).toHaveTextContent("Busy");
  });
});

