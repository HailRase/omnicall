// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { JSX } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { setRendererLanguage } from "../i18n/index.js";
import { HistoryPanelShell } from "../components/history/HistoryPanelShell.js";
import { MemoryRouter } from "react-router-dom";
import { ShellNavigationController, ShellRoutePanelOutlet } from "./index.js";
import { SoftphoneLayout } from "../widgets/SoftphoneLayout/SoftphoneLayout.js";

function NavigationLayoutHarness(): JSX.Element {
  return (
    <SoftphoneLayout
      header={<span>Header</span>}
      context={<div data-testid="call-context-zone">Call context</div>}
      controls={<div data-testid="call-controls-zone">Controls</div>}
      overlays={<ShellRoutePanelOutlet />}
    />
  );
}

function OverlayLayoutHarness({ overlays }: Readonly<{ overlays: JSX.Element }>): JSX.Element {
  return (
    <SoftphoneLayout
      header={<span>Header</span>}
      context={<div data-testid="call-context-zone">Call context</div>}
      controls={<div data-testid="call-controls-zone">Controls</div>}
      overlays={overlays}
    />
  );
}

describe("ShellNavigationController", () => {
  afterEach(() => {
    cleanup();
    setRendererLanguage("ru");
  });

  it("keeps layout zones mounted across route transitions", () => {
    render(
      <MemoryRouter initialEntries={["/history"]}>
        <ShellNavigationController layout={<NavigationLayoutHarness />} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("layout-context-zone")).toBeInTheDocument();
    expect(screen.getByTestId("call-context-zone")).toBeInTheDocument();
    expect(screen.getByTestId("call-controls-zone")).toBeInTheDocument();
    expect(screen.getByTestId("shell-route-panel-outlet")).toHaveAttribute(
      "data-shell-route",
      "history",
    );
  });

  it("marks settings route without unmounting layout zones", () => {
    render(
      <MemoryRouter initialEntries={["/settings/sessions"]}>
        <ShellNavigationController layout={<NavigationLayoutHarness />} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("call-context-zone")).toBeInTheDocument();
    expect(screen.getByTestId("shell-route-panel-outlet")).toHaveAttribute(
      "data-shell-route",
      "settings",
    );
  });

  it("redirects unknown routes to dialpad", () => {
    render(
      <MemoryRouter initialEntries={["/unknown-panel"]}>
        <ShellNavigationController layout={<NavigationLayoutHarness />} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("shell-route-panel-outlet")).toHaveAttribute(
      "data-shell-route",
      "dialpad",
    );
  });

  it("marks contacts route without unmounting layout zones", () => {
    render(
      <MemoryRouter initialEntries={["/contacts/agent-1/edit"]}>
        <ShellNavigationController layout={<NavigationLayoutHarness />} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("call-context-zone")).toBeInTheDocument();
    expect(screen.getByTestId("call-controls-zone")).toBeInTheDocument();
    expect(screen.getByTestId("shell-route-panel-outlet")).toHaveAttribute(
      "data-shell-route",
      "contactEdit",
    );
  });

  it("renders history sidebar inside overlay layer below window controls chrome", () => {
    render(
      <OverlayLayoutHarness
        overlays={
          <HistoryPanelShell
            open
            presentation="sidebar"
            title="История звонков"
            isLoading={false}
            isEmpty
            errorMessage={null}
            rows={[]}
            onClose={() => undefined}
            onRedial={() => undefined}
          />
        }
      />,
    );

    expect(screen.getByTestId("history-panel-shell")).toBeInTheDocument();
    expect(screen.getByTestId("history-panel-empty")).toHaveTextContent("История звонков пуста.");
    expect(screen.getByRole("region", { name: "История звонков" })).toBeVisible();
  });
});
