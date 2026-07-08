// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationItem } from "../../hooks/useNotifications.js";
import { setRendererLanguage } from "../../i18n/index.js";
import { toast } from "../ui/sonner/index.js";
import { NotificationViewport } from "./NotificationViewport.js";

afterEach(() => {
  toast.dismiss();
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
  options: Readonly<{
    closable?: boolean;
    durationMs?: number;
    stacking?: "stacked" | "single";
    maxVisible?: number;
  }> = {},
): ReturnType<typeof render> {
  return render(
    <NotificationViewport
      placement="bottom-right"
      stacking={options.stacking ?? "stacked"}
      durationMs={options.durationMs ?? 200}
      closable={options.closable ?? true}
      maxVisible={options.maxVisible ?? 3}
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

  it("keeps toaster mounted when queue is empty", () => {
    renderViewport([]);

    expect(screen.getByTestId("notification-viewport")).toBeInTheDocument();
    expect(screen.queryByTestId("notification-toast")).not.toBeInTheDocument();
  });

  it("renders Sonner toast with message and viewport", async () => {
    renderViewport([baseItem]);

    expect(screen.getByTestId("notification-viewport")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("notification-toast")).toBeInTheDocument();
      expect(screen.getByText("Saved successfully")).toBeInTheDocument();
    });
  });

  it("auto-dismisses through Sonner toast lifecycle", async () => {
    const onDismiss = vi.fn();
    renderViewport([baseItem], onDismiss);

    await waitFor(() => {
      expect(screen.getByText("Saved successfully")).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(onDismiss).toHaveBeenCalledWith("toast-1");
      },
      { timeout: 1000 },
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("manual close calls onDismiss once", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    renderViewport([baseItem], onDismiss);

    await waitFor(() => {
      expect(screen.getByText("Saved successfully")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Закрыть" }));

    expect(onDismiss).toHaveBeenCalledWith("toast-1");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not re-open toast in loop after manual close", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    renderViewport([baseItem], onDismiss);

    await waitFor(() => {
      expect(screen.getByText("Saved successfully")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Закрыть" }));

    await waitFor(() => {
      expect(screen.queryByText("Saved successfully")).not.toBeInTheDocument();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("allows showing same id again after queue removal", async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <NotificationViewport
        placement="bottom-right"
        stacking="stacked"
        durationMs={10_000}
        closable
        maxVisible={3}
        items={[baseItem]}
        onDismiss={onDismiss}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Saved successfully")).toBeInTheDocument();
    });

    rerender(
      <NotificationViewport
        placement="bottom-right"
        stacking="stacked"
        durationMs={10_000}
        closable
        maxVisible={3}
        items={[]}
        onDismiss={onDismiss}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Saved successfully")).not.toBeInTheDocument();
    });

    rerender(
      <NotificationViewport
        placement="bottom-right"
        stacking="stacked"
        durationMs={10_000}
        closable
        maxVisible={3}
        items={[baseItem]}
        onDismiss={onDismiss}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Saved successfully")).toBeInTheDocument();
    });
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

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Повторить" }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("applies single mode viewport settings", () => {
    render(
      <NotificationViewport
        placement="bottom-right"
        stacking="single"
        durationMs={200}
        closable
        maxVisible={3}
        items={[]}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByTestId("notification-viewport")).toBeInTheDocument();
    expect(screen.getByLabelText("Уведомления alt+T")).toBeInTheDocument();
  });

  it("updates localized message after language change", async () => {
    const keyedItem: NotificationItem = {
      ...baseItem,
      id: "localized",
      messageKey: "settings.general.themeLabel",
      messageText: null,
      durationMs: 10_000,
    };
    const { rerender } = renderViewport([keyedItem], vi.fn(), { durationMs: 10_000 });

    await waitFor(() => {
      expect(screen.getByText("Тема интерфейса")).toBeInTheDocument();
    });

    setRendererLanguage("en");
    rerender(
      <NotificationViewport
        placement="bottom-right"
        stacking="stacked"
        durationMs={10_000}
        closable
        maxVisible={3}
        items={[keyedItem]}
        onDismiss={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Interface theme")).toBeInTheDocument();
    });
  });

  it("keeps close button for sticky toast when viewport default closable is false", async () => {
    renderViewport(
      [
        {
          ...baseItem,
          id: "sticky",
          durationMs: 0,
          closable: true,
        },
      ],
      vi.fn(),
      { closable: false, durationMs: 0 },
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Закрыть" })).toBeInTheDocument();
    });
  });

  it("allows pointer interaction through notification viewport", async () => {
    renderViewport([{ ...baseItem, durationMs: 10_000 }], vi.fn(), { durationMs: 10_000 });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Закрыть" })).toBeInTheDocument();
    });

    const toaster = document.querySelector("[data-sonner-toaster]");
    expect(toaster).not.toBeNull();
    expect(getComputedStyle(toaster as Element).pointerEvents).toBe("auto");
  });

});
