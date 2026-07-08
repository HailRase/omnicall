// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupJsdomRadix } from "../../test/setupJsdomRadix.js";
import { TruncatedTextLine } from "./TruncatedTextLine.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

describe("TruncatedTextLine", () => {
  it("does not show tooltip when text fits", () => {
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return 80;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 120;
      },
    });

    render(<TruncatedTextLine text="Short name" className="line" />);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("enables tooltip when text overflows", () => {
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return 200;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 100;
      },
    });

    render(<TruncatedTextLine text="Very long caller display name" className="line" />);

    expect(screen.getByText("Very long caller display name")).toBeInTheDocument();
  });
});
