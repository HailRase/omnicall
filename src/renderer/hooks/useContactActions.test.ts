// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { ok } from "@shared/result/index.js";
import { useContactActions } from "./useContactActions.js";

describe("useContactActions CSV export", () => {
  it("notifies with saved file name after successful export", async () => {
    const notify = vi.fn();
    const facade = {
      listContacts: vi.fn(),
      getContact: vi.fn(),
      createContact: vi.fn(),
      updateContact: vi.fn(),
      deleteContact: vi.fn(),
      callContact: vi.fn(),
      importContactsFromCsv: vi.fn(),
      exportContactsToCsv: vi.fn().mockResolvedValue(
        ok({
          kind: "exported",
          contactCount: 2,
          savedFileName: "contacts-export-2026-07-08.csv",
        }),
      ),
    } as unknown as AccountBootstrapFacade;

    const { result } = renderHook(() => useContactActions({ facade, notify }));

    await act(async () => {
      const exportResult = await result.current.exportContactsCsv();
      expect(exportResult).toEqual({
        kind: "exported",
        contactCount: 2,
        savedFileName: "contacts-export-2026-07-08.csv",
      });
    });

    expect(notify).toHaveBeenCalledWith({
      level: "success",
      messageKey: "contacts.csv.success.exported",
      messageParams: {
        count: 2,
        fileName: "contacts-export-2026-07-08.csv",
      },
      module: "contacts",
      functionId: "contacts.csv.export",
      interruptClass: "informational",
    });
  });

  it("notifies when export is cancelled", async () => {
    const notify = vi.fn();
    const facade = {
      listContacts: vi.fn(),
      getContact: vi.fn(),
      createContact: vi.fn(),
      updateContact: vi.fn(),
      deleteContact: vi.fn(),
      callContact: vi.fn(),
      importContactsFromCsv: vi.fn(),
      exportContactsToCsv: vi.fn().mockResolvedValue(ok({ kind: "cancelled" })),
    } as unknown as AccountBootstrapFacade;

    const { result } = renderHook(() => useContactActions({ facade, notify }));

    await act(async () => {
      const exportResult = await result.current.exportContactsCsv();
      expect(exportResult).toEqual({ kind: "cancelled" });
    });

    expect(notify).toHaveBeenCalledWith({
      level: "info",
      messageKey: "contacts.csv.info.exportCancelled",
      module: "contacts",
      functionId: "contacts.csv.export",
      interruptClass: "informational",
    });
  });
});
