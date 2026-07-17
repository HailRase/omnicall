// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyAuthorizationExecutionFailure,
  applyAuthorizationExecutionStage,
  initialAuthorizationProgressProjection,
} from "@application/projections/settings/authorizationProgressProjection.js";
import { OcpSignInProgress } from "./OcpSignInProgress.js";

afterEach(cleanup);

describe("OcpSignInProgress", () => {
  it("renders all five stages and marks the active stage", () => {
    const progress = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "awaiting_authorization_data",
      "attempt-1",
    );
    render(<OcpSignInProgress progress={progress} onRestart={vi.fn()} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("Ожидание данных OCP и SIP").closest("li")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("shows timeout and restarts the full flow", async () => {
    const onRestart = vi.fn();
    const active = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "submitting_token_to_ocp",
      "attempt-1",
    );
    render(
      <OcpSignInProgress
        progress={applyAuthorizationExecutionFailure(active, "timeout")}
        onRestart={onRestart}
      />,
    );

    expect(screen.getByText("Таймаут")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("account-ocp-progress-restart"));
    expect(onRestart).toHaveBeenCalledOnce();
  });
});
