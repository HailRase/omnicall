// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExternalServicesJournalEntryVm } from "@application/index.js";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { ExternalServicesJournal } from "./ExternalServicesJournal.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

function createEntry(
  overrides: Partial<ExternalServicesJournalEntryVm> = {},
): ExternalServicesJournalEntryVm {
  return {
    id: "entry-1",
    startedAt: "2026-07-29T12:00:00.000Z",
    collectionName: "CRM",
    requestName: "Notify",
    eventType: "manual_run",
    outcome: "http_success",
    status: 200,
    durationMs: 42,
    requestUrl: "https://crm.example.test/hooks",
    requestHeaders: [
      { id: "header-auth", key: "Authorization", value: "***" },
      { id: "header-trace", key: "X-Trace", value: "safe" },
    ],
    responseBody: "{\"ok\":true}",
    responseBodyTruncated: false,
    errorCode: null,
    errorMessage: null,
    ...overrides,
  };
}

describe("ExternalServicesJournal", () => {
  it("renders empty, loading, and retryable error states", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(
      <ExternalServicesJournal
        panel={{ loadState: "loading", entries: [], capped: false }}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByTestId("external-services-journal-section")).toBeInTheDocument();
    expect(document.querySelector("[aria-busy='true']")).not.toBeNull();

    rerender(
      <ExternalServicesJournal
        panel={{ loadState: "ready", entries: [], capped: false }}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByTestId("external-services-journal-empty")).toHaveTextContent(
      "Записей пока нет",
    );

    rerender(
      <ExternalServicesJournal
        panel={{ loadState: "error", entries: [], capped: false }}
        onRetry={onRetry}
      />,
    );
    await user.click(screen.getByTestId("external-services-journal-retry"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows redacted headers, truncation, and a 100-entry cap hint", async () => {
    const user = userEvent.setup();
    const entries = [
      createEntry({
        id: "entry-new",
        responseBody: "partial-body",
        responseBodyTruncated: true,
        outcome: "http_error",
        status: 500,
        errorCode: "http_error",
        errorMessage: "failed",
      }),
      createEntry({ id: "entry-old" }),
    ];

    render(
      <ExternalServicesJournal
        panel={{ loadState: "ready", entries, capped: true }}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByTestId("external-services-journal")).toBeInTheDocument();
    expect(screen.getByText("Показаны последние 100 записей.")).toBeInTheDocument();
    expect(screen.getByTestId("external-services-journal-entry-entry-new")).toBeInTheDocument();

    const entry = screen.getByTestId("external-services-journal-entry-entry-new");
    await user.click(entry.querySelector("button") ?? entry);

    expect(screen.getByTestId("external-services-journal-header-header-auth")).toHaveTextContent(
      "***",
    );
    expect(screen.queryByText("Bearer")).not.toBeInTheDocument();
    expect(screen.getByText("Тело ответа обрезано.")).toBeInTheDocument();
    expect(screen.getByText(/http_error: failed/)).toBeInTheDocument();
  });
});
