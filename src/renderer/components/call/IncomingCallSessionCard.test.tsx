// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IncomingCallSessionCard } from "./IncomingCallSessionCard.js";

afterEach(() => {
  cleanup();
});

const baseProps = {
  callId: "incoming-1",
  callerNumber: "+12025550100",
  displayName: "John Doe",
autoAnswerSecondsRemaining: null,
  autoAnswerTimeoutSec: null,
  uiState: "incomingRinging" as const,
  isSelected: true,
  answerDisabledReason: null,
  rejectDisabledReason: null,
  onSelect: vi.fn(),
  onAnswer: vi.fn(),
  onReject: vi.fn(),
};

describe("IncomingCallSessionCard", () => {
  it("renders caller number, status, and action buttons", () => {
    render(<IncomingCallSessionCard {...baseProps} />);

    expect(screen.getByTestId("incoming-call-session-incoming-1")).toBeInTheDocument();
    expect(screen.getByText("+12025550100")).toBeInTheDocument();
    expect(screen.getByTestId("incoming-call-status-label")).toHaveTextContent("Звонок");
    expect(screen.getByTestId("answer-call")).toHaveTextContent("Ответить");
    expect(screen.getByTestId("reject-call")).toHaveTextContent("Отклонить");
  });

  it("invokes answer with video when provided", () => {
    const onAnswerWithVideo = vi.fn();
    render(
      <IncomingCallSessionCard
        {...baseProps}
        onAnswerWithVideo={onAnswerWithVideo}
        videoAnswerDisabledReason={null}
      />,
    );

    fireEvent.click(screen.getByTestId("answer-call-video"));
    expect(onAnswerWithVideo).toHaveBeenCalledTimes(1);
  });

  it("selects incoming session without answering", () => {
    const onSelect = vi.fn();
    render(<IncomingCallSessionCard {...baseProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId("incoming-call-session-select"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("invokes answer and reject callbacks", () => {
    const onAnswer = vi.fn();
    const onReject = vi.fn();
    render(
      <IncomingCallSessionCard
        {...baseProps}
        onAnswer={onAnswer}
        onReject={onReject}
      />,
    );

    fireEvent.click(screen.getByTestId("answer-call"));
    fireEvent.click(screen.getByTestId("reject-call"));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("shows answer disabled reason", () => {
    render(
      <IncomingCallSessionCard
        {...baseProps}
        answerDisabledReason="Автоответ заблокирован"
      />,
    );

    expect(screen.getByTestId("incoming-answer-disabled-reason")).toHaveTextContent(
      "Автоответ заблокирован",
    );
    expect(screen.getByTestId("answer-call")).toBeDisabled();
  });

  it("marks selected state for accessibility", () => {
    render(<IncomingCallSessionCard {...baseProps} isSelected />);

    expect(screen.getByTestId("incoming-call-session-select")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
