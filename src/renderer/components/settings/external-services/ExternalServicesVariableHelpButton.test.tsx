// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { ExternalServicesVariableHelpButton } from "./ExternalServicesVariableHelpButton.js";

beforeEach(setupJsdomRadix);
afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

function renderInScrollPane(ui: React.ReactElement): void {
  const pane = document.createElement("div");
  pane.style.overflow = "auto";
  pane.style.position = "relative";
  pane.style.height = "120px";
  document.body.append(pane);
  render(ui, { container: pane });
}

describe("ExternalServicesVariableHelpButton", () => {
  it("opens and closes the help popup on click", async () => {
    const user = userEvent.setup();
    renderInScrollPane(
      <ExternalServicesVariableHelpButton
        variableLabel="Событие ACD"
        description="Какое событие очереди прислала OCP (например queued)."
        testId="external-services-variable-help-acd_event"
      />,
    );
    const button = screen.getByTestId("external-services-variable-help-acd_event");
    expect(screen.queryByTestId("external-services-variable-help-acd_event-popup")).toBeNull();
    await user.click(button);
    const popup = await screen.findByTestId("external-services-variable-help-acd_event-popup");
    expect(popup).toHaveTextContent("Какое событие очереди прислала OCP (например queued).");
    expect(popup.parentElement).toHaveStyle({ overflow: "auto" });
    await user.click(button);
    expect(screen.queryByTestId("external-services-variable-help-acd_event-popup")).toBeNull();
  });

  it("closes the popup on Escape", async () => {
    const user = userEvent.setup();
    renderInScrollPane(
      <ExternalServicesVariableHelpButton
        variableLabel="Очередь"
        description="Название очереди."
        testId="external-services-variable-help-queue_name"
      />,
    );
    await user.click(screen.getByTestId("external-services-variable-help-queue_name"));
    expect(
      await screen.findByTestId("external-services-variable-help-queue_name-popup"),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("external-services-variable-help-queue_name-popup")).toBeNull();
  });

  it("flips above when there is no room below inside the scroll pane", async () => {
    const user = userEvent.setup();
    const pane = document.createElement("div");
    pane.style.overflow = "auto";
    pane.style.position = "relative";
    pane.style.height = "120px";
    pane.style.width = "240px";
    document.body.append(pane);
    const mount = document.createElement("div");
    pane.append(mount);

    const mockRect = (
      element: Element,
      rect: Readonly<{ top: number; left: number; width: number; height: number }>,
    ): void => {
      element.getBoundingClientRect = (): DOMRect => ({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.top + rect.height,
        right: rect.left + rect.width,
        x: rect.left,
        y: rect.top,
        toJSON: () => rect,
      });
    };

    mockRect(pane, { top: 0, left: 0, width: 240, height: 120 });
    render(
      <ExternalServicesVariableHelpButton
        variableLabel="Фаза ACD"
        description="Когда softphone получил данные очереди: progress или accepted."
        testId="external-services-variable-help-acd_phase"
      />,
      { container: mount },
    );
    const button = screen.getByTestId("external-services-variable-help-acd_phase");
    mockRect(button, { top: 96, left: 8, width: 16, height: 16 });
    await user.click(button);
    const popup = await screen.findByTestId("external-services-variable-help-acd_phase-popup");
    mockRect(popup, { top: 0, left: 8, width: 180, height: 48 });
    // Floating UI remeasures after mount; force a scroll tick for autoUpdate.
    pane.dispatchEvent(new Event("scroll"));
    await screen.findByTestId("external-services-variable-help-acd_phase-popup");
    expect(popup.getAttribute("data-placement") ?? "").toMatch(/^top/);
  });
});
