// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setRendererLanguage } from "../../i18n/index.js";
import { ContactsImportSummaryPanel } from "./ContactsImportSummaryPanel.js";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  setRendererLanguage("ru");
});

describe("ContactsImportSummaryPanel", () => {
  it("renders import summary counts and failed rows", () => {
    const onClose = vi.fn();

    render(
      <ContactsImportSummaryPanel
        open
        summary={{
          createdCount: 2,
          skippedDuplicateCount: 1,
          failedRows: [{ rowNumber: 4, errors: ["primary_phone_invalid"] }],
        }}
        onClose={onClose}
      />,
    );

    expect(screen.getByTestId("contacts-import-summary-created")).toHaveTextContent("2");
    expect(screen.getByTestId("contacts-import-summary-skipped")).toHaveTextContent("1");
    expect(screen.getByTestId("contacts-import-summary-failed")).toHaveTextContent("1");
    expect(screen.getByTestId("contacts-import-summary-failed-rows")).toHaveTextContent(
      "Строка 4",
    );

    fireEvent.click(screen.getByTestId("contacts-import-summary-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
