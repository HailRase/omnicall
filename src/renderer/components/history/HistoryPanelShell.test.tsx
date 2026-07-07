// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  it("renders localized empty state with hint", () => {
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
    expect(screen.getByTestId("history-panel-empty")).toHaveTextContent(
      "Совершите первый звонок через вкладку набора номера.",
    );
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

  it("renders grouped list, missed styling, and routes redial", () => {
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
            primaryLabel: "Alice",
            directionLabel: "Исходящий",
            outcomeLabel: "Завершён",
            startedAtLabel: "07.07.2026, 13:00",
            timeLabel: "13:00",
            startedAtIso: "2026-07-07T13:00:00",
            direction: "outgoing",
            outcome: "completed",
            isMissed: false,
            durationLabel: "1 мин.",
            secondaryTimeLabel: "60 с",
            redialDisabledReason: null,
          },
          {
            id: "entry-2",
            remoteNumber: "+12025550101",
            displayLabel: null,
            primaryLabel: "+12025550101",
            directionLabel: "Входящий",
            outcomeLabel: "Пропущен",
            startedAtLabel: "07.07.2026, 13:05",
            timeLabel: "13:05",
            startedAtIso: "2026-07-07T13:05:00",
            direction: "incoming",
            outcome: "missed",
            isMissed: true,
            durationLabel: "—",
            secondaryTimeLabel: "13:05",
            redialDisabledReason: "Недоступно во время активного звонка",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("history-panel-list")).toBeInTheDocument();
    expect(screen.getByTestId("history-filter-all")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("history-redial-entry-1"));
    expect(onRedial).toHaveBeenCalledWith("entry-1");
    expect(screen.getByTestId("history-redial-entry-2")).toBeDisabled();
    expect(screen.getByTestId("history-entry-entry-2")).toHaveTextContent("+12025550101");
  });

  it("filters missed calls only", async () => {
    const user = userEvent.setup();

    render(
      <HistoryPanelShell
        {...baseProps}
        presentation="sidebar"
        isLoading={false}
        isEmpty={false}
        errorMessage={null}
        rows={[
          {
            id: "entry-1",
            remoteNumber: "+12025550100",
            displayLabel: "Alice",
            primaryLabel: "Alice",
            directionLabel: "Исходящий",
            outcomeLabel: "Завершён",
            startedAtLabel: "07.07.2026, 13:00",
            timeLabel: "13:00",
            startedAtIso: "2026-07-07T13:00:00",
            direction: "outgoing",
            outcome: "completed",
            isMissed: false,
            durationLabel: "1 мин.",
            secondaryTimeLabel: "60 с",
            redialDisabledReason: null,
          },
          {
            id: "entry-2",
            remoteNumber: "+12025550101",
            displayLabel: null,
            primaryLabel: "+12025550101",
            directionLabel: "Входящий",
            outcomeLabel: "Пропущен",
            startedAtLabel: "07.07.2026, 13:05",
            timeLabel: "13:05",
            startedAtIso: "2026-07-07T13:05:00",
            direction: "incoming",
            outcome: "missed",
            isMissed: true,
            durationLabel: "—",
            secondaryTimeLabel: "13:05",
            redialDisabledReason: null,
          },
        ]}
      />,
    );

    await user.click(screen.getByTestId("history-filter-missed"));
    expect(screen.queryByTestId("history-entry-entry-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("history-entry-entry-2")).toBeInTheDocument();
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
