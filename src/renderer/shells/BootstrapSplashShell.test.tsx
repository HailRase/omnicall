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

vi.mock("../helpers/bootSplashDom.js", () => ({
  dismissBootSplash: vi.fn(),
}));

describe("BootstrapSplashShell", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders branded loading splash with progress", () => {
    render(<BootstrapSplashShell variant="loading" progress={42} />);

    const root = screen.getByTestId("bootstrap-loading");
    expect(root).toHaveAttribute("role", "status");
    expect(root).toHaveAttribute("aria-busy", "true");
    expect(root).not.toHaveAttribute("data-settled");
    expect(within(root).getByText("Axatalk")).toBeInTheDocument();
    expect(within(root).getByText("Loading application…")).toBeInTheDocument();
    expect(within(root).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
    expect(within(root).getByTestId("bootstrap-ball-stage")).not.toHaveAttribute("data-settled");
  });

  it("settles the bounce when progress reaches 100", () => {
    render(<BootstrapSplashShell variant="loading" progress={100} />);

    const root = screen.getByTestId("bootstrap-loading");
    expect(root).toHaveAttribute("data-settled", "true");
    expect(within(root).getByTestId("bootstrap-ball-stage")).toHaveAttribute(
      "data-settled",
      "true",
    );
    expect(within(root).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("keeps indeterminate progress when progress prop is omitted", () => {
    render(<BootstrapSplashShell variant="loading" />);

    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(screen.getByTestId("bootstrap-ball-stage")).not.toHaveAttribute("data-settled");
  });

  it("phase-locks the bounce with a negative animation-delay", () => {
    render(<BootstrapSplashShell variant="loading" progress={20} />);

    const stage = screen.getByTestId("bootstrap-ball-stage");
    const ball = stage.firstElementChild;
    expect(ball).toBeInstanceOf(HTMLElement);
    const delay = (ball as HTMLElement).style.animationDelay;
    expect(delay).toMatch(/^-?\d+(\.\d+)?ms$/);
  });

  it("renders error splash with message", () => {
    render(<BootstrapSplashShell variant="error" message="Initialization failed" />);

    const root = screen.getByTestId("bootstrap-error");
    expect(root).toHaveAttribute("role", "alert");
    expect(within(root).getByText("Initialization failed")).toBeInTheDocument();
    expect(within(root).queryByRole("progressbar")).not.toBeInTheDocument();
    expect(within(root).queryByTestId("bootstrap-ball-stage")).toBeInTheDocument();
  });
});
