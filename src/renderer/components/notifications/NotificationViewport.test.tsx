// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationItem } from "../../hooks/useNotifications.js";
import { setRendererLanguage } from "../../i18n/index.js";
import { NotificationViewport } from "./NotificationViewport.js";

afterEach(() => {
  cleanup();
  setRendererLanguage("ru");
});

beforeEach(() => {
  setRendererLanguage("ru");
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

function renderViewport(
  items: ReadonlyArray<NotificationItem>,
  onDismiss: (id: string) => void = vi.fn(),
): ReturnType<typeof render> {
  return render(
    <NotificationViewport
      placement="bottom-right"
      durationMs={200}
      items={items}
      onDismiss={onDismiss}
    />,
  );
}

const baseItem: NotificationItem = {
  id: "toast-1",
  level: "success",
  messageKey: null,
  messageText: "Saved successfully",
  messageParams: null,
  durationMs: 200,
  closable: true,
  action: null,
  onClose: null,
};

describe("NotificationViewport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

  it("renders nothing when queue is empty", () => {
    const { container } = renderViewport([]);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders UI Kit toast with message and viewport", () => {
    renderViewport([baseItem]);

    expect(screen.getByTestId("notification-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("notification-toast")).toBeInTheDocument();
    expect(screen.getByText("Saved successfully")).toBeInTheDocument();
  });

  it("auto-dismisses through Radix toast lifecycle", async () => {
    const onDismiss = vi.fn();
    renderViewport([baseItem], onDismiss);

    expect(screen.getByText("Saved successfully")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(onDismiss).toHaveBeenCalledWith("toast-1");
      },
      { timeout: 1000 },
    );
  });

  it("dismisses on close button click", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    renderViewport([baseItem], onDismiss);

    await user.click(screen.getByRole("button", { name: "Закрыть" }));

    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });

  it("renders action button", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const item: NotificationItem = {
      ...baseItem,
      durationMs: 10_000,
      action: {
        id: "retry",
        labelKey: "common.retry",
        onClick: onAction,
      },
    };

    renderViewport([item]);

    await user.click(screen.getByTestId("notification-action-retry"));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
