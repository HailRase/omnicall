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
  it("renders compact row with stage title, status icon, and status text", () => {
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
    expect(screen.getByTestId("account-ocp-progress-active-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("account-ocp-progress-overall")).not.toBeInTheDocument();
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

  it("shows generic failed status with tooltip icon and reconnects from footer", async () => {
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

    expect(screen.getByText("Ошибка")).toBeInTheDocument();
    expect(screen.queryByText("Таймаут")).not.toBeInTheDocument();
    expect(screen.getByTestId("account-ocp-progress-failure-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("account-ocp-progress-failure")).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId("account-ocp-progress-reconnect"));
    expect(onReconnect).toHaveBeenCalledOnce();
    expect(screen.getByTestId("account-ocp-progress-disconnect")).toHaveTextContent(
      "Отключить OCP",
    );
    await userEvent.click(screen.getByTestId("account-ocp-progress-disconnect"));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it("announces semantic active stage via live region without percent ticks", () => {
    const progress = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "requesting_authorization_token",
      "attempt-live",
      Date.now(),
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

    const live = screen.getByTestId("account-ocp-progress-live-status");
    expect(live).toHaveAttribute("role", "status");
    expect(live).toHaveTextContent("Выполняется");
  });

  it("applies compact density for the main softphone window", () => {
    const progress = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "requesting_authorization_token",
      "attempt-compact",
      Date.now(),
    );
    render(
      <OcpSignInProgress
        open={true}
        progress={progress}
        reconnectEnabled={false}
        density="compact"
        onDisconnect={vi.fn()}
        onReconnect={vi.fn()}
      />,
    );

    expect(screen.getByTestId("account-ocp-progress-modal")).toHaveAttribute(
      "data-density",
      "compact",
    );
    expect(screen.queryByText("Выполняется")).not.toBeInTheDocument();
    expect(screen.queryByText("Ожидает")).not.toBeInTheDocument();
    expect(screen.getByTestId("account-ocp-progress-active-icon")).toBeInTheDocument();
  });
});
