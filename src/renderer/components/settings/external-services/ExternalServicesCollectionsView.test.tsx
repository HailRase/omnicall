// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import {
  ExternalServicesSidebar,
  type ExternalServicesSidebarProps,
} from "./ExternalServicesSidebar.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

function renderSidebar(
  overrides: Partial<ExternalServicesSidebarProps> = {},
): ReturnType<typeof render> {
  const props: ExternalServicesSidebarProps = {
    collections: [],
    selection: { kind: "none" },
    busy: false,
    loadState: "ready",
    onCreateCollection: vi.fn(),
    onImportCollection: vi.fn(),
    onSelectCollection: vi.fn(),
    onSelectRequest: vi.fn(),
    onCreateRequest: vi.fn(),
    onRenameCollection: vi.fn(),
    onDuplicateCollection: vi.fn(),
    onExportCollection: vi.fn(),
    onEditVariables: vi.fn(),
    onDeleteCollection: vi.fn(),
    onToggleRequest: vi.fn(),
    onRenameRequest: vi.fn(),
    onDuplicateRequest: vi.fn(),
    onDeleteRequest: vi.fn(),
    ...overrides,
  };
  return render(<ExternalServicesSidebar {...props} />);
}

describe("ExternalServicesSidebar", () => {
  it("renders empty state with create and import actions", async () => {
    const user = userEvent.setup();
    const onCreateCollection = vi.fn();
    const onImportCollection = vi.fn();
    renderSidebar({ onCreateCollection, onImportCollection });

    expect(screen.getByTestId("external-services-collections")).toBeInTheDocument();
    await user.click(screen.getByTestId("external-services-create-collection"));
    expect(onCreateCollection).toHaveBeenCalledOnce();
    await user.click(screen.getByTestId("external-services-import-collection"));
    expect(onImportCollection).toHaveBeenCalledOnce();
  });

  it("selects a request, quick-adds, and toggles enable via menu action", async () => {
    const user = userEvent.setup();
    const onSelectRequest = vi.fn();
    const onCreateRequest = vi.fn();
    const onToggleRequest = vi.fn();
    const collectionId = "a0b1c2d3-e4f5-4a67-8b90-123456789012";
    const requestId = "b0b1c2d3-e4f5-4a67-8b90-123456789012";
    renderSidebar({
      collections: [
        {
          id: collectionId,
          name: "CRM",
          enabled: true,
          requests: [{ id: requestId, name: "Webhook", method: "POST", enabled: true }],
        },
      ],
      onSelectRequest,
      onCreateRequest,
      onToggleRequest,
    });

    expect(screen.getByTestId(`external-services-collection-${collectionId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`external-services-request-status-${requestId}`)).toBeInTheDocument();
    await user.click(screen.getByTestId(`external-services-request-${requestId}`));
    expect(onSelectRequest).toHaveBeenCalledWith(collectionId, requestId);
    await user.click(screen.getByTestId(`external-services-collection-add-${collectionId}`));
    expect(onCreateRequest).toHaveBeenCalledWith(collectionId);
    await user.click(screen.getByTestId(`external-services-request-menu-${requestId}`));
    await user.click(screen.getByRole("menuitem", { name: "Выключить" }));
    expect(onToggleRequest).toHaveBeenCalledWith(collectionId, requestId, false);
  });
});
