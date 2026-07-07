// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsNumberInput } from "./SettingsNumberInput.js";

afterEach(() => {
  cleanup();
});

describe("SettingsNumberInput", () => {
  it("forwards numeric changes", () => {
    const onChange = vi.fn();

    render(
      <SettingsNumberInput
        id="settings-test-number"
        value={5}
        min={1}
        data-testid="settings-test-number"
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByTestId("settings-test-number"), {
      target: { value: "8" },
    });

    expect(onChange).toHaveBeenCalledWith(8);
  });

  it("exposes invalid state through aria-invalid", () => {
    render(
      <SettingsNumberInput
        id="settings-test-number"
        value={2}
        min={5}
        invalid
        data-testid="settings-test-number"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("settings-test-number")).toHaveAttribute("aria-invalid", "true");
  });

  it("renders suffix and accessible suffix label", () => {
    render(
      <SettingsNumberInput
        id="settings-test-number"
        value={10}
        min={1}
        suffix="сек"
        suffixAccessibleId="settings-test-number-suffix-sr"
        suffixAccessibleLabel="секунд"
        data-testid="settings-test-number"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("сек")).toBeInTheDocument();
    expect(screen.getByText("секунд")).toHaveAttribute("id", "settings-test-number-suffix-sr");
  });
});
