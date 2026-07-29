// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import {
  ExternalServicesCollectionsView,
  type ExternalServicesCollectionsViewProps,
} from "./ExternalServicesCollectionsView.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

function renderView(
  overrides: Partial<ExternalServicesCollectionsViewProps> = {},
): ReturnType<typeof render> {
  const props: ExternalServicesCollectionsViewProps = {
    collections: [],
    loadState: "ready",
    busy: false,
    errorMessage: null,
    statusMessage: null,
    nameDialog: {
      open: false,
      mode: "create",
      value: "",
      errorMessage: null,
    },
    deleteDialog: {
      open: false,
      collectionName: "",
    },
    onRetry: vi.fn(),
    onCreate: vi.fn(),
    onImport: vi.fn(),
    onOpenCollection: vi.fn(),
    onToggleCollection: vi.fn(),
    onRenameCollection: vi.fn(),
    onDuplicateCollection: vi.fn(),
    onExportCollection: vi.fn(),
    onEditVariables: vi.fn(),
    onDeleteCollection: vi.fn(),
    onNameDialogOpenChange: vi.fn(),
    onNameDialogValueChange: vi.fn(),
    onNameDialogSubmit: vi.fn(),
    onDeleteDialogOpenChange: vi.fn(),
    onDeleteDialogConfirm: vi.fn(),
    journal: {
      panel: { loadState: "ready", entries: [], capped: false },
      onRetry: vi.fn(),
    },
    ...overrides,
  };
  return render(<ExternalServicesCollectionsView {...props} />);
}

describe("ExternalServicesCollectionsView", () => {
  it("renders empty state with create and import actions", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onImport = vi.fn();
    renderView({ onCreate, onImport });

    expect(screen.getByTestId("external-services-collections")).toBeInTheDocument();
    expect(screen.getByTestId("external-services-journal-section")).toBeInTheDocument();
    await user.click(screen.getByTestId("external-services-create-collection"));
    expect(onCreate).toHaveBeenCalledOnce();
    await user.click(screen.getByTestId("external-services-import-collection"));
    expect(onImport).toHaveBeenCalledOnce();
  });

  it("shows enabled count and toggles a collection without drill-down", async () => {
    const user = userEvent.setup();
    const onToggleCollection = vi.fn();
    renderView({
      collections: [
        {
          id: "a0b1c2d3-e4f5-4a67-8b90-123456789012",
          name: "CRM",
          enabled: true,
          enabledRequestCount: 1,
          requestCount: 2,
          variables: [],
        },
      ],
      onToggleCollection,
    });

    expect(
      screen.getByTestId(
        "external-services-collection-enabled-count-a0b1c2d3-e4f5-4a67-8b90-123456789012",
      ),
    ).toHaveTextContent("1/2");
    await user.click(
      screen.getByTestId(
        "external-services-collection-toggle-a0b1c2d3-e4f5-4a67-8b90-123456789012",
      ),
    );
    expect(onToggleCollection).toHaveBeenCalledWith(
      "a0b1c2d3-e4f5-4a67-8b90-123456789012",
      false,
    );
  });

  it("renders load error with retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderView({
      loadState: "error",
      errorMessage: "Could not load External Services. Try again.",
      onRetry,
    });

    await user.click(
      screen.getByRole("button", {
        name: "Повторить",
      }),
    );
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
