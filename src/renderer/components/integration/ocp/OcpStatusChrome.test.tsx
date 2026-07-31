// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OcpConnectionBanner } from "./OcpConnectionBanner.js";
import styles from "./OcpConnectionBanner.module.css";
import { OcpStatusTimer } from "./OcpStatusTimer.js";
import { OcpProxyStatusScreen } from "./OcpProxyStatusScreen.js";

vi.mock("../../../i18n/index.js", () => ({
  useI18n: () => ({
    t: (key: string, params?: Readonly<Record<string, string | number>>) => {
      if (key === "ocp.connection.reconnecting" && params !== undefined) {
        return `Reconnecting ${String(params["attempt"])}/${String(params["max"])}`;
      }
      if (
        key === "ocp.connection.reconnectingTitle" ||
        key === "ocp.connection.failedTitle"
      ) {
        return "OCP";
      }
      if (key === "ocp.connection.failed") {
        return "No connection";
      }
      if (key === "ocp.connection.retry") {
        return "Retry";
      }
      if (key === "ocp.status.timer.aria" && params !== undefined) {
        return `In status for ${String(params["elapsed"])}`;
      }
      return key;
    },
  }),
}));

afterEach(() => {
  cleanup();
});

describe("OcpStatusTimer", () => {
  it("renders nothing when since is null", () => {
    const { container } = render(<OcpStatusTimer since={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders elapsed label as hh:mm:ss", () => {
    render(<OcpStatusTimer since={Date.now() - 5_000} />);
    expect(screen.getByTestId("ocp-status-timer")).toHaveTextContent("00:00:05");
  });
});

describe("OcpConnectionBanner", () => {
  it("hides when not visible", () => {
    render(
      <OcpConnectionBanner
        visible={false}
        mode="failed"
        reconnectAttempt={1}
        maxReconnectAttempts={6}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("ocp-connection-banner")).not.toBeInTheDocument();
  });

  it("shows reconnecting copy with attempt counter", () => {
    render(
      <OcpConnectionBanner
        visible
        mode="reconnecting"
        reconnectAttempt={2}
        maxReconnectAttempts={6}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByTestId("ocp-connection-banner-message")).toHaveTextContent(
      "Reconnecting 2/6",
    );
    expect(screen.queryByTestId("ocp-retry-connect")).not.toBeInTheDocument();
  });

  it("mounts the elevated shell-status-banner anchor class", () => {
    render(
      <OcpConnectionBanner
        visible
        mode="reconnecting"
        reconnectAttempt={1}
        maxReconnectAttempts={6}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByTestId("ocp-connection-banner-anchor").className).toContain(
      styles.anchor,
    );
  });

  it("calls onRetry from failed banner", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <OcpConnectionBanner
        visible
        mode="failed"
        reconnectAttempt={6}
        maxReconnectAttempts={6}
        onRetry={onRetry}
      />,
    );
    await user.click(screen.getByTestId("ocp-retry-connect"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("OcpProxyStatusScreen", () => {
  it("renders nothing without proxy status", () => {
    const { container } = render(
      <OcpProxyStatusScreen proxyStatus={null} onOpenIntegrations={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("opens integrations from SESSION_EXIST overlay", async () => {
    const user = userEvent.setup();
    const onOpenIntegrations = vi.fn();
    render(
      <OcpProxyStatusScreen
        proxyStatus="SESSION_EXIST"
        onOpenIntegrations={onOpenIntegrations}
      />,
    );
    expect(screen.getByTestId("ocp-proxy-status-screen")).toHaveAttribute(
      "data-proxy-status",
      "SESSION_EXIST",
    );
    await user.click(screen.getByTestId("ocp-proxy-open-integrations"));
    expect(onOpenIntegrations).toHaveBeenCalledTimes(1);
  });
});
