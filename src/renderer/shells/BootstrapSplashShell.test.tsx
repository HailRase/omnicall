// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BootstrapSplashShell } from "./BootstrapSplashShell.js";

vi.mock("../i18n/index.js", () => ({
  useI18n: () => ({
    t: (key: string) => {
      if (key === "bootstrap.brand") {
        return "Axatalk";
      }
      if (key === "bootstrap.loading") {
        return "Loading application…";
      }
      return key;
    },
  }),
}));

describe("BootstrapSplashShell", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders branded loading splash with progress", () => {
    render(<BootstrapSplashShell variant="loading" />);

    const root = screen.getByTestId("bootstrap-loading");
    expect(root).toHaveAttribute("role", "status");
    expect(root).toHaveAttribute("aria-busy", "true");
    expect(within(root).getByText("Axatalk")).toBeInTheDocument();
    expect(within(root).getByText("Loading application…")).toBeInTheDocument();
    expect(within(root).getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders error splash with message", () => {
    render(<BootstrapSplashShell variant="error" message="Initialization failed" />);

    const root = screen.getByTestId("bootstrap-error");
    expect(root).toHaveAttribute("role", "alert");
    expect(within(root).getByText("Initialization failed")).toBeInTheDocument();
    expect(within(root).queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
