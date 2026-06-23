// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IncomingCallModal } from "./IncomingCallModal.js";

afterEach(() => {
  cleanup();
});

describe("IncomingCallModal", () => {
  it("renders caller identity and actions", () => {
    render(
      <IncomingCallModal
        visible
        callerNumber="+12025550100"
        displayName="Alice"
        queueLabelState="loading"
        queueName={null}
        campaignContextTitle={null}
        ringingState="ringing"
        autoAnswerSecondsRemaining={3}
        uiState="incomingRinging"
        rejectReasonRequired
        rejectReasons={["break", "meeting"]}
        selectedBreakReason="break"
        answerDisabledReason={null}
        rejectDisabledReason={null}
        onAnswer={vi.fn()}
        onReject={vi.fn()}
        onSelectBreakReason={vi.fn()}
      />,
    );

    expect(screen.getByTestId("incoming-call-modal")).toBeInTheDocument();
    expect(screen.getByTestId("caller-identity")).toHaveTextContent("Alice");
    expect(screen.getByTestId("auto-answer-countdown")).toHaveTextContent("3s");
  });

  it("shows queue-info-label when OCP queue is loading", () => {
    render(
      <IncomingCallModal
        visible
        callerNumber="+12025550100"
        displayName="Alice"
        queueLabelState="loading"
        queueName={null}
        campaignContextTitle={null}
        ringingState="ringing"
        autoAnswerSecondsRemaining={null}
        uiState="queueInfoPending"
        rejectReasonRequired={false}
        rejectReasons={["break"]}
        selectedBreakReason={null}
        answerDisabledReason={null}
        rejectDisabledReason={null}
        onAnswer={vi.fn()}
        onReject={vi.fn()}
        onSelectBreakReason={vi.fn()}
      />,
    );

    expect(screen.getByTestId("queue-info-label")).toHaveTextContent("Pending");
  });

  it("shows campaign context line when provided", () => {
    render(
      <IncomingCallModal
        visible
        callerNumber="+12025550100"
        displayName="Alice"
        queueLabelState="ready"
        queueName="Support"
        campaignContextTitle="Outbound Campaign"
        ringingState="ringing"
        autoAnswerSecondsRemaining={null}
        uiState="callerIdentityResolved"
        rejectReasonRequired={false}
        rejectReasons={["break"]}
        selectedBreakReason={null}
        answerDisabledReason={null}
        rejectDisabledReason={null}
        onAnswer={vi.fn()}
        onReject={vi.fn()}
        onSelectBreakReason={vi.fn()}
      />,
    );

    expect(screen.getByTestId("incoming-campaign-context")).toHaveTextContent(
      "Outbound Campaign",
    );
    expect(screen.getByTestId("queue-info-label")).toHaveTextContent("Support");
  });

  it("emits callbacks for answer, reject and reason selection", () => {
    const onAnswer = vi.fn();
    const onReject = vi.fn();
    const onSelectBreakReason = vi.fn();
    render(
      <IncomingCallModal
        visible
        callerNumber="+12025550100"
        displayName={null}
        queueLabelState="hidden"
        queueName={null}
        campaignContextTitle={null}
        ringingState="ringing"
        autoAnswerSecondsRemaining={null}
        uiState="incomingRinging"
        rejectReasonRequired={false}
        rejectReasons={["break", "meeting"]}
        selectedBreakReason={null}
        answerDisabledReason={null}
        rejectDisabledReason={null}
        onAnswer={onAnswer}
        onReject={onReject}
        onSelectBreakReason={onSelectBreakReason}
      />,
    );

    fireEvent.click(screen.getByTestId("answer-call"));
    fireEvent.click(screen.getByTestId("reject-call"));
    fireEvent.change(screen.getByTestId("reject-reason-select"), {
      target: { value: "meeting" },
    });

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onSelectBreakReason).toHaveBeenCalledWith("meeting");
  });

  it("handles keyboard Enter and Escape", () => {
    const onAnswer = vi.fn();
    const onReject = vi.fn();
    render(
      <IncomingCallModal
        visible
        callerNumber="+12025550100"
        displayName={null}
        queueLabelState="hidden"
        queueName={null}
        campaignContextTitle={null}
        ringingState="ringing"
        autoAnswerSecondsRemaining={null}
        uiState="incomingRinging"
        rejectReasonRequired={false}
        rejectReasons={["break"]}
        selectedBreakReason={null}
        answerDisabledReason={null}
        rejectDisabledReason={null}
        onAnswer={onAnswer}
        onReject={onReject}
        onSelectBreakReason={vi.fn()}
      />,
    );

    const modal = screen.getByTestId("incoming-call-modal");
    fireEvent.keyDown(modal, { key: "Enter" });
    fireEvent.keyDown(modal, { key: "Escape" });

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("shows incoming-answer-disabled-reason in modal when answer blocked", () => {
    render(
      <IncomingCallModal
        visible
        callerNumber="+12025550100"
        displayName={null}
        queueLabelState="hidden"
        queueName={null}
        campaignContextTitle={null}
        ringingState="ringing"
        autoAnswerSecondsRemaining={null}
        uiState="incomingRinging"
        rejectReasonRequired={false}
        rejectReasons={["break"]}
        selectedBreakReason={null}
        answerDisabledReason="Second session disabled"
        rejectDisabledReason={null}
        onAnswer={vi.fn()}
        onReject={vi.fn()}
        onSelectBreakReason={vi.fn()}
      />,
    );

    expect(screen.getByTestId("incoming-answer-disabled-reason")).toHaveTextContent(
      "Second session disabled",
    );
  });
});
