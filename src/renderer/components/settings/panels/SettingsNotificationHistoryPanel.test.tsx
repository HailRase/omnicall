// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createUserNotificationAccountFilter,
  createUserNotificationEntryViewId,
} from "@application/projections/settings/userNotificationJournalViewModel.js";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { SettingsNotificationHistoryPanel } from "./SettingsNotificationHistoryPanel.js";

beforeEach(setupJsdomRadix);
afterEach(cleanup);

function createEntry(idValue: string, title: string) {
  const accountKey = createUserNotificationAccountFilter("agent@pbx.example");
  return {
    id: createUserNotificationEntryViewId(idValue),
    emittedAt: "2026-07-17T09:00:00.000Z",
    accountKey,
    accountDisplayLabel: "agent",
    level: "error" as const,
    module: "ocp" as const,
    functionId: "ocp.sign-in",
    titleKey: null,
    titleParams: {},
    titleSnapshot: title,
    suppressedAtEmission: true,
    correlationId: null,
  };
}

describe("SettingsNotificationHistoryPanel", () => {
  it("renders journal metadata in a UI Kit table with suppressed marker", async () => {
    const entry = createEntry("entry-1", "OCP недоступен");
    const query = vi.fn().mockResolvedValue({
      entries: [entry],
      total: 1,
      page: 1,
      pageSize: 20,
      pageCount: 1,
      identities: [{ accountKey: entry.accountKey, displayLabel: "agent" }],
    });
    render(<SettingsNotificationHistoryPanel query={query} />);

    await waitFor(() => {
      expect(screen.getByText("OCP недоступен")).toBeInTheDocument();
    });

    const table = screen.getByRole("table", {
      name: "Журнал уведомлений за последние 24 часа",
    });
    expect(table).toHaveAttribute(
      "data-testid",
      "settings-notification-history-table",
    );
    expect(
      within(table).getByRole("columnheader", { name: "Дата и время" }),
    ).toBeInTheDocument();
    expect(within(table).getByText("agent")).toBeInTheDocument();
    expect(within(table).getByText("Popup был отключён")).toBeInTheDocument();
    expect(screen.getByText("Страница 1 из 1")).toBeInTheDocument();
    expect(screen.getByText("Всего: 1")).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-notification-history-page"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-notification-history-page-size"),
    ).toBeInTheDocument();
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 20 }),
    );
  });

  it("changes page and pageSize through pagination selects", async () => {
    const user = userEvent.setup();
    const entry = createEntry("entry-2", "SIP timeout");
    const query = vi.fn().mockImplementation(
      (input: { page?: number; pageSize?: number }) =>
        Promise.resolve({
          entries: [entry],
          total: 40,
          page: input.page ?? 1,
          pageSize: input.pageSize ?? 20,
          pageCount: Math.ceil(40 / (input.pageSize ?? 20)),
          identities: [{ accountKey: entry.accountKey, displayLabel: "agent" }],
        }),
    );
    render(<SettingsNotificationHistoryPanel query={query} />);

    await waitFor(() => {
      expect(screen.getByText("SIP timeout")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("settings-notification-history-page-size"));
    await user.click(await screen.findByRole("option", { name: "10" }));

    await waitFor(() => {
      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 10 }),
      );
    });

    await user.click(screen.getByTestId("settings-notification-history-page"));
    await user.click(await screen.findByRole("option", { name: "2" }));

    await waitFor(() => {
      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, pageSize: 10 }),
      );
    });
  });

  it("shows empty state when journal has no matching entries", async () => {
    const query = vi.fn().mockResolvedValue({
      entries: [],
      total: 0,
      page: 1,
      pageSize: 20,
      pageCount: 1,
      identities: [],
    });
    render(<SettingsNotificationHistoryPanel query={query} />);

    await waitFor(() => {
      expect(
        screen.getByTestId("settings-notification-history-empty"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("За последние 24 часа уведомлений нет"),
    ).toBeInTheDocument();
  });
});
