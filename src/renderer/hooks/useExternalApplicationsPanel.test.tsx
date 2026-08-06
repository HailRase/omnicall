// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ok } from "@shared/result/index.js";
import type { UserSettings } from "@application/index.js";
import { useExternalApplicationsPanel } from "./useExternalApplicationsPanel.js";

type ExternalApplicationRow = UserSettings["externalApplications"]["applications"][number];

const APP_A_ID = "11111111-1111-4111-8111-111111111111" as ExternalApplicationRow["id"];
const APP_B_ID = "22222222-2222-4222-8222-222222222222" as ExternalApplicationRow["id"];

function makeApplication(
  id: ExternalApplicationRow["id"],
  name: string,
  enabled = true,
): ExternalApplicationRow {
  return {
    id,
    name,
    enabled,
    urlTemplate: "https://example.com/{{call_id}}",
    openMode: "electron_window",
    window: { width: 1100, height: 800, x: 100, y: 100 },
    variables: [],
    triggers: [],
    conditions: {
      callDirection: "any",
      queueNames: [],
    },
    windowBehavior: {
      raiseOnOpen: true,
      alwaysOnTopDuringCall: false,
      onCallEnded: "leave",
    },
  };
}

function makeUserSettings(
  applications: UserSettings["externalApplications"]["applications"],
): UserSettings {
  return {
    externalApplications: { applications },
  } as UserSettings;
}

describe("useExternalApplicationsPanel", () => {
  it("persists only enabled on sidebar toggle and keeps other draft edits dirty", async () => {
    const appA = makeApplication(APP_A_ID, "A", true);
    const appB = makeApplication(APP_B_ID, "B", true);
    const loaded = makeUserSettings([appA, appB]);
    const saveExternalApplicationsSettings = vi.fn(
      (next: UserSettings["externalApplications"]) =>
        Promise.resolve(
          ok({
            settings: makeUserSettings(next.applications),
            settingsRevision: 2,
          }),
        ),
    );
    const facade = {
      getUserSettingsForAccount: vi.fn(() => Promise.resolve(ok(loaded))),
      saveExternalApplicationsSettings,
      openExternalApplicationNow: vi.fn(),
      queryExternalApplicationsJournal: vi.fn(() => Promise.resolve(ok([]))),
    };
    const onActiveUserSettingsRefresh = vi.fn();

    const { result } = renderHook(() =>
      useExternalApplicationsPanel({
        facade,
        sectionActive: true,
        onActiveUserSettingsRefresh,
      }),
    );

    await waitFor(() => {
      expect(result.current.applications).toHaveLength(2);
    });

    act(() => {
      result.current.onChange({
        ...appA,
        urlTemplate: "https://dirty.example/{{call_id}}",
      });
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.onToggle(APP_B_ID, false);
    });

    await waitFor(() => {
      expect(saveExternalApplicationsSettings).toHaveBeenCalledOnce();
    });

    const persisted = saveExternalApplicationsSettings.mock.calls[0]?.[0] as
      | UserSettings["externalApplications"]
      | undefined;
    expect(
      persisted?.applications.find((row: ExternalApplicationRow) => row.id === APP_B_ID)?.enabled,
    ).toBe(false);
    expect(
      persisted?.applications.find((row: ExternalApplicationRow) => row.id === APP_A_ID)
        ?.urlTemplate,
    ).toBe("https://example.com/{{call_id}}");
    expect(
      result.current.applications.find((row: ExternalApplicationRow) => row.id === APP_A_ID)
        ?.urlTemplate,
    ).toBe("https://dirty.example/{{call_id}}");
    expect(
      result.current.applications.find((row: ExternalApplicationRow) => row.id === APP_B_ID)
        ?.enabled,
    ).toBe(false);
    expect(result.current.isDirty).toBe(true);
  });

  it("opens discard dialog when selecting another app with unsaved changes", async () => {
    const appA = makeApplication(APP_A_ID, "A");
    const appB = makeApplication(APP_B_ID, "B");
    const loaded = makeUserSettings([appA, appB]);
    const facade = {
      getUserSettingsForAccount: vi.fn(() => Promise.resolve(ok(loaded))),
      saveExternalApplicationsSettings: vi.fn(),
      openExternalApplicationNow: vi.fn(),
      queryExternalApplicationsJournal: vi.fn(() => Promise.resolve(ok([]))),
    };

    const { result } = renderHook(() =>
      useExternalApplicationsPanel({
        facade,
        sectionActive: true,
        onActiveUserSettingsRefresh: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.selection).toEqual({ kind: "application", id: APP_A_ID });
    });

    act(() => {
      result.current.onChange({
        ...appA,
        name: "Dirty A",
      });
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.onSelectApplication(APP_B_ID);
    });

    expect(result.current.discardDialogOpen).toBe(true);
    expect(result.current.selection).toEqual({ kind: "application", id: APP_A_ID });

    act(() => {
      result.current.onDiscardConfirm();
    });

    expect(result.current.discardDialogOpen).toBe(false);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.selection).toEqual({ kind: "application", id: APP_B_ID });
    expect(result.current.applications.find((row) => row.id === APP_A_ID)?.name).toBe("A");
  });
});
