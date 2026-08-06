// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import { WindowGeometryEditor } from "./WindowGeometryEditor.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

const currentId =
  "9f28d923-23c3-4b9e-9c4a-cc83719dd12e" as ExternalApplicationsPanelApplication["id"];

const geometry = {
  width: 1100,
  height: 800,
  x: 100,
  y: 100,
};

const currentApp = {
  id: currentId,
  name: "Current",
  openMode: "electron_window" as const,
  window: geometry,
};

function renderEditor(
  onChange = vi.fn(),
  applications: ReadonlyArray<typeof currentApp> = [currentApp],
): ReturnType<typeof render> {
  return render(
    <WindowGeometryEditor
      window={geometry}
      applicationName="CRM Card"
      disabled={false}
      onChange={onChange}
      currentApplicationId={currentId}
      applications={applications}
    />,
  );
}

describe("WindowGeometryEditor", () => {
  it("applies a size preset to the draft window", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderEditor(onChange);

    await user.click(
      screen.getByTestId("external-applications-geometry-preset-hd16_9"),
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ width: 1280, height: 720, x: 100, y: 100 }),
    );
  });

  it("lets the user type freely and commits width on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderEditor(onChange);

    const widthInput = screen.getByTestId("external-applications-geometry-width");
    await user.clear(widthInput);
    await user.type(widthInput, "640");
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.blur(widthInput);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ width: 640, height: 800 }),
    );
  });

  it("clamps oversized width and shows a validation error", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderEditor(onChange);

    const widthInput = screen.getByTestId("external-applications-geometry-width");
    await user.clear(widthInput);
    await user.type(widthInput, "99999999");
    fireEvent.blur(widthInput);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ width: 3840, height: 800 }),
    );
    expect(screen.getByText("Допустимо: 320–3840")).toBeInTheDocument();
  });

  it("updates X and Y from numeric inputs on blur", () => {
    const onChange = vi.fn();

    renderEditor(onChange);

    const xInput = screen.getByTestId("external-applications-geometry-x");
    fireEvent.change(xInput, { target: { value: "240" } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(xInput);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ x: 240, y: 100 }),
    );

    onChange.mockClear();
    const yInput = screen.getByTestId("external-applications-geometry-y");
    fireEvent.change(yInput, { target: { value: "160" } });
    fireEvent.blur(yInput);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ x: 100, y: 160 }),
    );
  });

  it("nudges position with arrow keys when the preview card is focused", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderEditor(onChange);

    const card = screen.getByTestId("external-applications-geometry-card");
    card.focus();
    expect(card).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ x: 110, y: 100 }),
    );

    onChange.mockClear();
    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ x: 100, y: 110 }),
    );
  });

  it("exposes resize handles on the preview card", () => {
    renderEditor();

    expect(
      screen.getByTestId("external-applications-geometry-resize-se"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("external-applications-geometry-resize-e"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("external-applications-geometry-resize-s"),
    ).toBeInTheDocument();
  });

  it("shows the real application name on the preview card", () => {
    renderEditor();

    expect(screen.getByTestId("external-applications-geometry-card")).toHaveAttribute(
      "aria-label",
      "CRM Card",
    );
  });

  it("wires pointer drag handlers on the preview card", () => {
    renderEditor();

    const card = screen.getByTestId("external-applications-geometry-card");
    expect(card).toHaveAttribute("role", "group");
    fireEvent.pointerDown(card, { pointerId: 1, button: 0, buttons: 1 });
    expect(card).toHaveAttribute("data-dragging", "true");
    fireEvent.pointerUp(card, { pointerId: 1, button: 0, buttons: 0 });
    expect(card).toHaveAttribute("data-dragging", "false");
  });
});
