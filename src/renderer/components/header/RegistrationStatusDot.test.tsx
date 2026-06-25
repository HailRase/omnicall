// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RegistrationStatusDot } from "./RegistrationStatusDot.js";

afterEach(() => {
  cleanup();
});

describe("RegistrationStatusDot", () => {
  it("renders dot with accessible label and variant", () => {
    render(
      <RegistrationStatusDot
        variant="registered_online"
        label="Registration Registered, phone Online"
      />,
    );

    const dot = screen.getByTestId("registration-status-dot");
    expect(dot).toHaveAttribute("data-variant", "registered_online");
    expect(dot).toHaveAttribute("aria-label", "Registration Registered, phone Online");
  });

  it("marks registering dot as busy", () => {
    render(<RegistrationStatusDot variant="registering" label="Registration Registering" />);

    expect(screen.getByTestId("registration-status-dot")).toHaveAttribute("aria-busy", "true");
  });
});
