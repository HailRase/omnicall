// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "./Sonner.js";
import { toast } from "./index.js";

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

describe("Sonner theme bridge", () => {
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

  it("renders toaster with token bridge class", async () => {
    render(<Toaster position="bottom-right" />);
    toast("Token bridge smoke");

    await waitFor(() => {
      const toaster = document.querySelector("[data-sonner-toaster]");
      expect(toaster).toBeInTheDocument();
      expect(toaster?.className).toContain("toaster");
    });
  });

  it("syncs Sonner theme with document dark theme", async () => {
    document.documentElement.setAttribute("data-theme", "dark");
    render(<Toaster position="bottom-right" />);
    toast("Dark theme toast");

    await waitFor(() => {
      const toaster = document.querySelector("[data-sonner-toaster]");
      expect(toaster).toHaveAttribute("data-sonner-theme", "dark");
    });
  });
});
