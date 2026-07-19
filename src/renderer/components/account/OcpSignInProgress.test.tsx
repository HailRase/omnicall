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
  it("renders compact row with stage title and status beside icon", () => {
    const progress = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "awaiting_authorization_data",
      "attempt-1",
      Date.now() - 1_000,
    );
    render(
      <OcpSignInProgress
        open={true}
        progress={progress}
        reconnectEnabled={false}
        onDisconnect={vi.fn()}
        onReconnect={vi.fn()}
      />,
    );

    expect(screen.getByTestId("account-ocp-progress-modal")).toBeInTheDocument();
    expect(
      screen.getByTestId("account-ocp-progress-stage-awaiting_authorization_data"),
    ).toHaveAttribute("data-state", "active");
    expect(screen.getByText("Аутентификация токена в модуле")).toBeInTheDocument();
    expect(screen.getByText("Выполняется")).toBeInTheDocument();
  });

  it("keeps reconnect disabled while early failure still fills blue", () => {
    const active = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "requesting_authorization_token",
      "attempt-1",
      Date.now() - 500,
    );
    render(
      <OcpSignInProgress
        open={true}
        progress={applyAuthorizationExecutionFailure(active, {
          reason: "failed",
          failureKind: "http_failed",
          failureCode: "Failed to fetch",
        })}
        reconnectEnabled={true}
        onDisconnect={vi.fn()}
        onReconnect={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId("account-ocp-progress-stage-requesting_authorization_token"),
    ).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("account-ocp-progress-reconnect")).toBeDisabled();
  });

  it("reveals timeout after window and reconnects from footer", async () => {
    const onDisconnect = vi.fn();
    const onReconnect = vi.fn();
    const active = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "submitting_token_to_ocp",
      "attempt-1",
      Date.now() - 20_000,
    );
    render(
      <OcpSignInProgress
        open={true}
        progress={applyAuthorizationExecutionFailure(active, {
          reason: "timeout",
          failureKind: "timeout",
          failureCode: "ocp_auth_timeout",
        })}
        reconnectEnabled={true}
        onDisconnect={onDisconnect}
        onReconnect={onReconnect}
      />,
    );

    expect(screen.getByText("Таймаут")).toBeInTheDocument();
    expect(screen.getByTestId("account-ocp-progress-failure-icon")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("account-ocp-progress-reconnect"));
    expect(onReconnect).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByTestId("account-ocp-progress-disconnect"));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });
});
