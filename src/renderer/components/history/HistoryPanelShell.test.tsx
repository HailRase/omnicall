// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setRendererLanguage } from "../../i18n/index.js";
import { HistoryPanelShell } from "./HistoryPanelShell.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  setRendererLanguage("ru");
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

const baseProps = {
  open: true,
  title: "История звонков",
  onClose: vi.fn(),
  onRedial: vi.fn(),
} as const;

describe("HistoryPanelShell", () => {
  it("renders localized empty state", () => {
    render(
      <HistoryPanelShell
        {...baseProps}
        presentation="sidebar"
        isLoading={false}
        isEmpty
        errorMessage={null}
        rows={[]}
      />,
    );

    expect(screen.getByTestId("history-panel-empty")).toHaveTextContent("История звонков пуста.");
  });

  it("renders loading and error states", () => {
    const { rerender } = render(
      <HistoryPanelShell
        {...baseProps}
        presentation="fullPanel"
        isLoading
        isEmpty={false}
        errorMessage={null}
        rows={[]}
      />,
    );

    expect(screen.getByTestId("history-panel-loading")).toHaveTextContent("Загрузка истории");

    rerender(
      <HistoryPanelShell
        {...baseProps}
        presentation="fullPanel"
        isLoading={false}
        isEmpty={false}
        errorMessage="Не удалось загрузить историю."
        rows={[]}
      />,
    );

    expect(screen.getByTestId("history-panel-error")).toHaveTextContent(
      "Не удалось загрузить историю.",
    );
  });

  it("renders populated list and routes redial", () => {
    const onRedial = vi.fn();

    render(
      <HistoryPanelShell
        {...baseProps}
        presentation="sidebar"
        isLoading={false}
        isEmpty={false}
        errorMessage={null}
        onRedial={onRedial}
        rows={[
          {
            id: "entry-1",
            remoteNumber: "+12025550100",
            displayLabel: "Alice",
            directionLabel: "Исходящий",
            outcomeLabel: "Завершён",
            startedAtLabel: "07.07.2026, 13:00",
            durationLabel: "1 мин.",
            redialDisabledReason: null,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByTestId("history-redial-entry-1"));
    expect(onRedial).toHaveBeenCalledWith("entry-1");
  });

  it("disables redial when policy reason is present", () => {
    render(
      <HistoryPanelShell
        {...baseProps}
        presentation="sidebar"
        isLoading={false}
        isEmpty={false}
        errorMessage={null}
        rows={[
          {
            id: "entry-2",
            remoteNumber: "+12025550101",
            displayLabel: null,
            directionLabel: "Входящий",
            outcomeLabel: "Пропущен",
            startedAtLabel: "07.07.2026, 13:05",
            durationLabel: "—",
            redialDisabledReason: "Недоступно во время активного звонка",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("history-redial-entry-2")).toBeDisabled();
  });

  it("closes via header button", () => {
    const onClose = vi.fn();

    render(
      <HistoryPanelShell
        {...baseProps}
        onClose={onClose}
        presentation="sidebar"
        isLoading={false}
        isEmpty
        errorMessage={null}
        rows={[]}
      />,
    );

    fireEvent.click(screen.getByTestId("history-panel-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
