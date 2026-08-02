// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createUserNotificationAccountFilter,
  createUserNotificationEntryViewId,
  USER_NOTIFICATION_MODULE_FILTERS,
  type UserNotificationModuleFilter,
} from "@application/projections/settings/userNotificationJournalViewModel.js";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { SettingsNotificationHistoryPanel } from "./SettingsNotificationHistoryPanel.js";

beforeEach(setupJsdomRadix);
afterEach(cleanup);

const EXPANDED_MODULE_LABELS: Readonly<
  Record<"sdk" | "updates" | "externalServices", string>
> = {
  sdk: "SDK",
  updates: "Обновления",
  externalServices: "Внешние сервисы",
};

function createEntry(
  idValue: string,
  title: string,
  options: Readonly<{
    module?: UserNotificationModuleFilter;
    suppressedAtEmission?: boolean;
  }> = {},
) {
  const accountKey = createUserNotificationAccountFilter("agent@pbx.example");
  return {
    id: createUserNotificationEntryViewId(idValue),
    emittedAt: "2026-07-17T09:00:00.000Z",
    accountKey,
    accountDisplayLabel: "agent",
    level: "error" as const,
    module: options.module ?? ("ocp" as const),
    functionId: "ocp.sign-in",
    titleKey: null,
    titleParams: {},
    titleSnapshot: title,
    suppressedAtEmission: options.suppressedAtEmission ?? true,
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

  it("exposes expanded module catalog in the history filter", async () => {
    const user = userEvent.setup();
    const entry = createEntry("entry-filter-catalog", "Legacy OCP", {
      module: "ocp",
    });
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
      expect(screen.getByText("Legacy OCP")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("settings-notification-history-module"));
    const listbox = await screen.findByRole("listbox");
    expect(
      within(listbox).getByRole("option", { name: "Все модули" }),
    ).toBeInTheDocument();
    for (const label of Object.values(EXPANDED_MODULE_LABELS)) {
      expect(
        within(listbox).getByRole("option", { name: label }),
      ).toBeInTheDocument();
    }
    expect(USER_NOTIFICATION_MODULE_FILTERS).toEqual(
      expect.arrayContaining(["sdk", "updates", "externalServices"]),
    );
    expect(
      within(listbox).getByRole("option", { name: "OCP" }),
    ).toBeInTheDocument();
    expect(
      within(listbox).getByRole("option", { name: "Система" }),
    ).toBeInTheDocument();
  });

  it("filters by expanded modules and still renders legacy module rows", async () => {
    const user = userEvent.setup();
    const legacyEntry = createEntry("entry-legacy", "Legacy system event", {
      module: "system",
      suppressedAtEmission: false,
    });
    const sdkEntry = createEntry("entry-sdk", "SDK pairing required", {
      module: "sdk",
      suppressedAtEmission: true,
    });
    const query = vi.fn().mockImplementation(
      (input: { module?: UserNotificationModuleFilter; search?: string }) => {
        const entries = [legacyEntry, sdkEntry].filter((entry) => {
          if (input.module !== undefined && entry.module !== input.module) {
            return false;
          }
          if (
            input.search !== undefined &&
            !entry.titleSnapshot
              .toLowerCase()
              .includes(input.search.trim().toLowerCase())
          ) {
            return false;
          }
          return true;
        });
        return Promise.resolve({
          entries,
          total: entries.length,
          page: 1,
          pageSize: 20,
          pageCount: 1,
          identities: [
            { accountKey: legacyEntry.accountKey, displayLabel: "agent" },
          ],
        });
      },
    );
    render(<SettingsNotificationHistoryPanel query={query} />);

    await waitFor(() => {
      expect(screen.getByText("Legacy system event")).toBeInTheDocument();
      expect(screen.getByText("SDK pairing required")).toBeInTheDocument();
    });

    const table = screen.getByTestId("settings-notification-history-table");
    expect(within(table).getByText("Система")).toBeInTheDocument();
    expect(within(table).getByText("SDK")).toBeInTheDocument();
    expect(within(table).getByText("Показан")).toBeInTheDocument();
    expect(within(table).getByText("Popup был отключён")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-notification-history-module"));
    await user.click(await screen.findByRole("option", { name: "SDK" }));

    await waitFor(() => {
      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({ module: "sdk", page: 1, pageSize: 20 }),
      );
    });
    await waitFor(() => {
      expect(screen.getByText("SDK pairing required")).toBeInTheDocument();
      expect(screen.queryByText("Legacy system event")).not.toBeInTheDocument();
    });

    const search = screen.getByPlaceholderText("Поиск по уведомлениям");
    await user.clear(search);
    await user.type(search, "pairing");

    await waitFor(() => {
      expect(query).toHaveBeenCalledWith(
        expect.objectContaining({ module: "sdk", search: "pairing" }),
      );
    });
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
