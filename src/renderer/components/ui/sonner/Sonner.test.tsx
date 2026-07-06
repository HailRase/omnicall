// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "./Sonner.js";
import { toast } from "./index.js";

function renderToaster(): void {
  render(<Toaster position="bottom-right" closeButton richColors />);
}

beforeAll(() => {
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = () => undefined;
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = () => undefined;
  }
});

describe("Sonner", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "light");
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    toast.dismiss();
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders Toaster without crashing", async () => {
    renderToaster();
    toast("Smoke test");

    await waitFor(() => {
      expect(document.querySelector("[data-sonner-toaster]")).toBeInTheDocument();
    });
  });

  it("renders toast message", async () => {
    renderToaster();
    toast("Event has been created");

    expect(await screen.findByText("Event has been created")).toBeInTheDocument();
  });

  it("renders description", async () => {
    renderToaster();
    toast("Event has been created", {
      description: "Sunday, December 03, 2023 at 9:00 AM",
    });

    expect(await screen.findByText("Sunday, December 03, 2023 at 9:00 AM")).toBeInTheDocument();
  });

  it("fires action callback", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderToaster();
    toast("Event has been created", {
      action: {
        label: "Undo",
        onClick,
      },
    });

    await user.click(await screen.findByRole("button", { name: "Undo" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("dismisses on close button click", async () => {
    const user = userEvent.setup();
    renderToaster();
    toast("Closable toast", { closeButton: true });

    await user.click(await screen.findByRole("button", { name: "Close toast" }));

    await waitFor(() => {
      expect(screen.queryByText("Closable toast")).not.toBeInTheDocument();
    });
  });

  it("auto-dismisses when duration is configured", async () => {
    renderToaster();
    toast("Auto close toast", { duration: 200 });

    expect(await screen.findByText("Auto close toast")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText("Auto close toast")).not.toBeInTheDocument();
      },
      { timeout: 1500 },
    );
  });

  it("applies position to the toaster viewport", async () => {
    render(<Toaster position="top-left" />);
    toast("Positioned toast");

    await waitFor(() => {
      const toaster = document.querySelector("[data-sonner-toaster]");
      expect(toaster).toHaveAttribute("data-x-position", "left");
      expect(toaster).toHaveAttribute("data-y-position", "top");
    });
  });

  it("renders distinguishable rich color toast types", async () => {
    render(<Toaster richColors />);
    toast.success("Success state");
    toast.error("Error state");

    await waitFor(() => {
      expect(screen.getByText("Success state")).toBeInTheDocument();
      expect(screen.getByText("Error state")).toBeInTheDocument();
    });

    expect(screen.getByText("Success state").closest("[data-sonner-toast]")).toHaveAttribute(
      "data-type",
      "success",
    );
    expect(screen.getByText("Error state").closest("[data-sonner-toast]")).toHaveAttribute(
      "data-type",
      "error",
    );
  });

  it("uses semantic token variables for Sonner theme overrides", async () => {
    renderToaster();
    toast("Token toast");

    await waitFor(() => {
      const toaster = document.querySelector("[data-sonner-toaster]");
      expect(toaster).not.toBeNull();
      expect(toaster?.className).toContain("toaster");
    });

    document.documentElement.setAttribute("data-theme", "dark");
    toast("Dark token toast");

    await waitFor(() => {
      expect(screen.getByText("Dark token toast")).toBeInTheDocument();
    });
  });
});
