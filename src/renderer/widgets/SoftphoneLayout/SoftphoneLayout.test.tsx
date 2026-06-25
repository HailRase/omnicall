// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SoftphoneLayout } from "./SoftphoneLayout.js";

afterEach(() => {
  cleanup();
});

describe("SoftphoneLayout", () => {
  it("renders four layout zones with stable test IDs", () => {
    render(
      <SoftphoneLayout
        header={<span>Header</span>}
        context={<span>Context</span>}
        controls={<span>Controls</span>}
        overlays={<span>Overlays</span>}
      />,
    );

    expect(screen.getByTestId("softphone-layout")).toBeInTheDocument();
    expect(screen.getByTestId("layout-header-zone")).toHaveTextContent("Header");
    expect(screen.getByTestId("layout-context-zone")).toHaveTextContent("Context");
    expect(screen.getByTestId("layout-controls-zone")).toHaveTextContent("Controls");
    expect(screen.getByTestId("layout-overlay-layer")).toHaveTextContent("Overlays");
  });

  it("applies collapsed layout marker when collapsed", () => {
    render(
      <SoftphoneLayout
        collapsed
        header={<span>Header</span>}
        context={<span>Context</span>}
        controls={<span>Controls</span>}
        overlays={null}
      />,
    );

    expect(screen.getByTestId("softphone-layout")).toHaveAttribute("data-collapsed", "true");
  });
});
