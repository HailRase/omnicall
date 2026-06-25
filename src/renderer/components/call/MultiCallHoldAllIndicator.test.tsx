// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MultiCallHoldAllIndicator } from "./MultiCallHoldAllIndicator.js";

afterEach(() => {
  cleanup();
});

describe("MultiCallHoldAllIndicator", () => {
  it("shows multi-call-hold-all-indicator when visible", () => {
    render(<MultiCallHoldAllIndicator visible />);
    expect(screen.getByTestId("multi-call-hold-all-indicator")).toHaveTextContent(
      "Удержание других звонков…",
    );
  });

  it("renders nothing when not visible", () => {
    render(<MultiCallHoldAllIndicator visible={false} />);
    expect(screen.queryByTestId("multi-call-hold-all-indicator")).not.toBeInTheDocument();
  });
});
