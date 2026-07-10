// @vitest-environment jsdom
import type { JSX } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from "./Toast.js";
import styles from "./Toast.module.css";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

function BasicToast({
  withDescription = true,
  withAction = false,
  withClose = false,
  duration,
  onAction,
  onClose,
}: Readonly<{
  withDescription?: boolean;
  withAction?: boolean;
  withClose?: boolean;
  duration?: number;
  onAction?: () => void;
  onClose?: () => void;
}>): JSX.Element {
  return (
    <ToastProvider {...(duration !== undefined ? { duration } : {})}>
      <ToastRoot defaultOpen {...(duration !== undefined ? { duration } : {})}>
        <ToastTitle>Settings saved</ToastTitle>
        {withDescription ? (
          <ToastDescription>Your preferences were updated successfully.</ToastDescription>
        ) : null}
        {withAction ? (
          <ToastAction altText="Undo settings change" onClick={onAction}>
            Undo
          </ToastAction>
        ) : null}
        {withClose ? <ToastClose closeLabel="Dismiss toast" onClick={onClose} /> : null}
      </ToastRoot>
      <ToastViewport />
    </ToastProvider>
  );
}

describe("Toast", () => {
  beforeEach(() => {
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

  it("renders title and description", () => {
    render(<BasicToast />);

    expect(screen.getByText("Settings saved")).toBeInTheDocument();
    expect(
      screen.getByText("Your preferences were updated successfully."),
    ).toBeInTheDocument();
  });

  it("calls action", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(<BasicToast withAction onAction={onAction} />);

    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("calls close", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<BasicToast withClose onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Dismiss toast" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("auto-dismisses when duration is configured", async () => {
    render(<BasicToast duration={200} />);

    expect(screen.getByText("Settings saved")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText("Settings saved")).not.toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });

  it("forwards ref to the toast root", () => {
    const ref = vi.fn();

    render(
      <ToastProvider>
        <ToastRoot ref={ref} defaultOpen>
          <ToastTitle>Ref toast</ToastTitle>
        </ToastRoot>
        <ToastViewport />
      </ToastProvider>,
    );

    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0]?.[0]).toBeInstanceOf(HTMLLIElement);
  });

  it("preserves caller className on toast root", () => {
    render(
      <ToastProvider>
        <ToastRoot defaultOpen className="custom-toast">
          <ToastTitle>Styled toast</ToastTitle>
        </ToastRoot>
        <ToastViewport />
      </ToastProvider>,
    );

    expect(screen.getByText("Styled toast").closest("li")).toHaveClass("custom-toast");
  });

  it("applies tone data attribute", () => {
    render(
      <ToastProvider>
        <ToastRoot defaultOpen tone="success">
          <ToastTitle>Success toast</ToastTitle>
        </ToastRoot>
        <ToastViewport />
      </ToastProvider>,
    );

    expect(screen.getByText("Success toast").closest("li")).toHaveAttribute(
      "data-tone",
      "success",
    );
  });

  it("protects internally controlled tone and type from native prop override", () => {
    render(
      <ToastProvider>
        <ToastRoot
          defaultOpen
          tone="destructive"
          data-tone="default"
          type="background"
        >
          <ToastTitle>Protected toast</ToastTitle>
        </ToastRoot>
        <ToastViewport />
      </ToastProvider>,
    );

    const toast = screen.getByText("Protected toast").closest("li");
    expect(toast).toHaveAttribute("data-tone", "destructive");
  });

  it("preserves caller className on viewport", () => {
    const { container } = render(
      <ToastProvider>
        <ToastRoot defaultOpen>
          <ToastTitle>Viewport toast</ToastTitle>
        </ToastRoot>
        <ToastViewport className="custom-viewport" />
      </ToastProvider>,
    );

    expect(container.querySelector("ol.custom-viewport")).not.toBeNull();
  });

  it("offsets top placement below shell window controls", () => {
    const { container } = render(
      <ToastProvider>
        <ToastRoot defaultOpen>
          <ToastTitle>Top toast</ToastTitle>
        </ToastRoot>
        <ToastViewport placement="top-right" />
      </ToastProvider>,
    );

    const viewport = container.querySelector("ol");
    expect(viewport).not.toBeNull();
    expect(viewport).toHaveClass(styles.viewportTopRight ?? "");
  });
});
