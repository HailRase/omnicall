// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IncomingCallActions } from "./IncomingCallActions.js";

afterEach(() => {
  cleanup();
});

describe("IncomingCallActions", () => {
  it("shows incoming-answer-disabled-reason when answer is blocked", () => {
    render(
      <IncomingCallActions
        answerDisabledReason="Second session disabled"
        rejectDisabledReason={null}
        onAnswer={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByTestId("incoming-answer-disabled-reason")).toHaveTextContent(
      "Second session disabled",
    );
    expect(screen.getByTestId("answer-call")).toBeDisabled();
  });

  it("hides incoming-answer-disabled-reason when answer is allowed", () => {
    render(
      <IncomingCallActions
        answerDisabledReason={null}
        rejectDisabledReason={null}
        onAnswer={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("incoming-answer-disabled-reason")).not.toBeInTheDocument();
    expect(screen.getByTestId("answer-call")).toBeEnabled();
  });
});
