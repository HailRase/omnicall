// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IncomingCallOverlay } from "./IncomingCallOverlay.js";

afterEach(() => {
  cleanup();
});

const baseProps = {
  visible: true,
  callerNumber: "+12025550100",
  displayName: "Алиса",
  queueLabelState: "ready" as const,
  queueName: "Поддержка",
  campaignContextTitle: null,
  autoAnswerSecondsRemaining: null,
  uiState: "incomingRinging" as const,
  answerDisabledReason: null,
  rejectDisabledReason: null,
  onAnswer: vi.fn(),
  onReject: vi.fn(),
};

describe("IncomingCallOverlay", () => {
  it("renders caller identity and action buttons", () => {
    render(<IncomingCallOverlay {...baseProps} />);

    expect(screen.getByTestId("incoming-call-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("caller-identity")).toHaveTextContent("Алиса");
    expect(screen.getByTestId("caller-identity")).toHaveTextContent("+12025550100");
    expect(screen.getByTestId("queue-info-label")).toHaveTextContent("Поддержка");
    expect(screen.getByRole("button", { name: "Ответить на вызов" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отклонить вызов" })).toBeInTheDocument();
  });

  it("shows auto-answer countdown and omits reject reason UI", () => {
    render(
      <IncomingCallOverlay
        {...baseProps}
        autoAnswerSecondsRemaining={3}
        uiState="autoAnswerCountdown"
      />,
    );

    expect(screen.getByTestId("auto-answer-countdown")).toHaveTextContent("Автоответ через 3");
    expect(screen.queryByTestId("reject-reason-select")).not.toBeInTheDocument();
  });

  it("shows campaign badge when provided", () => {
    render(
      <IncomingCallOverlay
        {...baseProps}
        campaignContextTitle="Исходящая кампания"
      />,
    );

    expect(screen.getByTestId("incoming-campaign-context")).toHaveTextContent(
      "Исходящая кампания",
    );
  });

  it("emits answer and reject callbacks", () => {
    const onAnswer = vi.fn();
    const onReject = vi.fn();
    render(
      <IncomingCallOverlay
        {...baseProps}
        displayName={null}
        onAnswer={onAnswer}
        onReject={onReject}
      />,
    );

    fireEvent.click(screen.getByTestId("answer-call"));
    fireEvent.click(screen.getByTestId("reject-call"));

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("handles keyboard Enter and Escape", () => {
    const onAnswer = vi.fn();
    const onReject = vi.fn();
    render(
      <IncomingCallOverlay
        {...baseProps}
        displayName={null}
        onAnswer={onAnswer}
        onReject={onReject}
      />,
    );

    const overlay = screen.getByTestId("incoming-call-overlay");
    fireEvent.keyDown(overlay, { key: "Enter" });
    fireEvent.keyDown(overlay, { key: "Escape" });

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("shows incoming-answer-disabled-reason when answer blocked", () => {
    render(
      <IncomingCallOverlay
        {...baseProps}
        answerDisabledReason="Вторая сессия отключена"
      />,
    );

    expect(screen.getByTestId("incoming-answer-disabled-reason")).toHaveTextContent(
      "Вторая сессия отключена",
    );
    expect(screen.getByTestId("answer-call")).toBeDisabled();
  });
});
