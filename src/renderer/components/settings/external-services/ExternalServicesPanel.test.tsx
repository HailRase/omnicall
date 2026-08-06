// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { ExternalServicesPanel } from "./ExternalServicesPanel.js";
import type { ExternalServicesPanelProps } from "./ExternalServicesPanel.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
});

const noop = (): void => undefined;

function createProps(
  overrides: Partial<ExternalServicesPanelProps> = {},
): ExternalServicesPanelProps {
  return {
    sidebar: {
      collections: [],
      selection: { kind: "none" },
      busy: false,
      loadState: "error",
      onCreateCollection: noop,
      onImportCollection: noop,
      onSelectCollection: noop,
      onSelectRequest: noop,
      onCreateRequest: noop,
      onRenameCollection: noop,
      onDuplicateCollection: noop,
      onExportCollection: noop,
      onEditVariables: noop,
      onDeleteCollection: noop,
      onToggleRequest: noop,
      onRenameRequest: noop,
      onDuplicateRequest: noop,
      onDeleteRequest: noop,
    },
    welcome: {
      journal: {
        panel: { loadState: "error", entries: [], capped: false },
        onRetry: noop,
      },
    },
    requestsView: null,
    requestEditor: null,
    loadErrorMessage: "Не удалось загрузить внешние сервисы. Повторите попытку.",
    statusMessage: null,
    onRetryLoad: vi.fn(),
    dialogs: {
      busy: false,
      nameDialog: {
        open: false,
        mode: "create",
        scope: "collection",
        value: "",
        errorMessage: null,
      },
      deleteDialog: { open: false, collectionName: "" },
      discardDialogOpen: false,
      onNameDialogOpenChange: noop,
      onNameDialogValueChange: noop,
      onNameDialogSubmit: noop,
      onDeleteDialogOpenChange: noop,
      onDeleteDialogConfirm: noop,
      onDiscardDialogOpenChange: noop,
      onDiscardConfirm: noop,
    },
    variablesDialog: null,
    ...overrides,
  };
}

describe("ExternalServicesPanel", () => {
  it("renders a top workspace load banner with retry without breaking layout", async () => {
    const user = userEvent.setup();
    const onRetryLoad = vi.fn();
    render(<ExternalServicesPanel {...createProps({ onRetryLoad })} />);

    expect(screen.getByTestId("external-services-workspace-banner")).toBeInTheDocument();
    expect(screen.getByTestId("external-services-load-error")).toHaveTextContent(
      "Не удалось загрузить внешние сервисы",
    );
    expect(screen.getByTestId("external-services-workspace-body")).toBeInTheDocument();

    await user.click(screen.getByTestId("external-services-load-retry"));
    expect(onRetryLoad).toHaveBeenCalledOnce();
  });

  it("hides the banner when load succeeds", () => {
    render(
      <ExternalServicesPanel
        {...createProps({
          loadErrorMessage: null,
          statusMessage: null,
          sidebar: {
            ...createProps().sidebar,
            loadState: "ready",
          },
          welcome: {
            journal: {
              panel: { loadState: "ready", entries: [], capped: false },
              onRetry: noop,
            },
          },
        })}
      />,
    );
    expect(screen.queryByTestId("external-services-workspace-banner")).not.toBeInTheDocument();
  });
});
