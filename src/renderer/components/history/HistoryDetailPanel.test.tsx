// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setRendererLanguage } from "../../i18n/index.js";
import { HistoryDetailPanel } from "./HistoryDetailPanel.js";

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

const sampleEntry = {
  id: "history-call-1",
  remoteNumber: "+12025550147",
  primaryLabel: "Alice",
  secondaryLabel: "+12025550147",
  contactId: "contact-1",
  presentationSource: "contact",
  directionLabel: "Входящий",
  outcomeLabel: "Завершён",
  dateLabel: "7 июл. 2026 г.",
  timeLabel: "13:00",
  durationLabel: "90 с",
  redialDisabledReason: null,
} as const;

describe("HistoryDetailPanel", () => {
  it("renders loading and not-found states", () => {
    const { rerender } = render(
      <HistoryDetailPanel
        isLoading
        isNotFound={false}
        entry={null}
        onRedial={vi.fn()}
        onContactAction={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTestId("history-detail-loading")).toHaveTextContent("Загрузка истории");

    rerender(
      <HistoryDetailPanel
        isLoading={false}
        isNotFound
        entry={null}
        onRedial={vi.fn()}
        onContactAction={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTestId("history-detail-not-found")).toHaveTextContent(
      "Запись истории не найдена",
    );
  });

  it("renders hero, metadata, and routes redial", () => {
    const onRedial = vi.fn();

    render(
      <HistoryDetailPanel
        isLoading={false}
        isNotFound={false}
        entry={sampleEntry}
        onRedial={onRedial}
        onContactAction={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTestId("history-detail-panel")).toHaveTextContent("Alice");
    expect(screen.getByTestId("history-detail-panel")).toHaveTextContent("Входящий");
    expect(screen.getByTestId("history-detail-panel")).toHaveTextContent("90 с");

    fireEvent.click(screen.getByTestId("history-detail-redial"));
    expect(onRedial).toHaveBeenCalledOnce();
  });

  it("shows disabled redial reason", () => {
    render(
      <HistoryDetailPanel
        isLoading={false}
        isNotFound={false}
        entry={{
          ...sampleEntry,
          redialDisabledReason: "Перезвон недоступен: SIP не зарегистрирован.",
        }}
        onRedial={vi.fn()}
        onContactAction={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTestId("history-detail-redial")).toBeDisabled();
  });

  it("routes contact action and reflects matched or unknown history number", () => {
    const onContactAction = vi.fn();
    const { rerender } = render(
      <HistoryDetailPanel
        isLoading={false}
        isNotFound={false}
        entry={sampleEntry}
        onRedial={vi.fn()}
        onContactAction={onContactAction}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTestId("history-detail-contact-action")).toHaveTextContent(
      "Открыть контакт",
    );
    fireEvent.click(screen.getByTestId("history-detail-contact-action"));
    expect(onContactAction).toHaveBeenCalledOnce();

    rerender(
      <HistoryDetailPanel
        isLoading={false}
        isNotFound={false}
        entry={{
          ...sampleEntry,
          contactId: null,
          presentationSource: "number",
        }}
        onRedial={vi.fn()}
        onContactAction={onContactAction}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByTestId("history-detail-contact-action")).toHaveTextContent(
      "Добавить в контакты",
    );
  });

  it("routes delete action from danger group", () => {
    const onDelete = vi.fn();

    render(
      <HistoryDetailPanel
        isLoading={false}
        isNotFound={false}
        entry={sampleEntry}
        onRedial={vi.fn()}
        onContactAction={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByTestId("history-detail-delete"));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
