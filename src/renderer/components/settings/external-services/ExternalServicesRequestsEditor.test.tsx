// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import {
  ExternalServicesRequestEditor,
  type ExternalServicesRequestDraft,
} from "./ExternalServicesRequestEditor.js";
import { ExternalServicesRequestsView } from "./ExternalServicesRequestsView.js";
import { ExternalServicesRunResult } from "./ExternalServicesRunResult.js";

const journal = {
  panel: { loadState: "ready" as const, entries: [], capped: false },
  onRetry: vi.fn(),
};

const draft: ExternalServicesRequestDraft = {
  id: "a0b1c2d3-e4f5-4a67-8b90-123456789012",
  name: "CRM event",
  enabled: true,
  method: "POST",
  url: "https://crm.example/events",
  query: [{ id: "query-1", key: "source", value: "phone", enabled: true }],
  headers: [{ id: "header-1", key: "X-Token", value: "safe", enabled: true }],
  body: { mode: "json", value: "{\"event\":\"call\"}" },
  triggers: ["call_answered"],
};

beforeEach(setupJsdomRadix);
afterEach(cleanup);

describe("External Services requests UI", () => {
  it("renders the collection workspace empty state and create action", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(
      <ExternalServicesRequestsView
        collection={{
          id: "collection",
          name: "CRM",
          enabled: true,
          enabledRequestCount: 0,
          requestCount: 0,
          variables: [],
        }}
        busy={false}
        journal={journal}
        onCreate={onCreate}
        onEditVariables={vi.fn()}
      />,
    );
    expect(screen.getByText("Коллекция пуста")).toBeInTheDocument();
    await user.click(screen.getByTestId("external-services-create-request"));
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("emits editor field, table, trigger, save, delete, and send intents", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSave = vi.fn();
    const onDelete = vi.fn();
    const onRunNow = vi.fn();
    render(
      <ExternalServicesRequestEditor
        collectionName="CRM"
        draft={draft}
        busy={false}
        errorMessage={null}
        runState="idle"
        runResult={null}
        journal={journal}
        onChange={onChange}
        onSave={onSave}
        onRunNow={onRunNow}
        onDelete={onDelete}
      />,
    );
    await user.clear(screen.getByTestId("external-services-request-url"));
    await user.type(screen.getByTestId("external-services-request-url"), "https://new.example");
    expect(onChange).toHaveBeenCalled();
    await user.click(screen.getByTestId("external-services-request-method"));
    await user.click(screen.getByText("PUT"));
    await user.click(screen.getByText("Body"));
    await user.click(screen.getByTestId("external-services-body-mode"));
    await user.click(screen.getByText("Текст"));
    await user.clear(screen.getByTestId("external-services-body-editor"));
    await user.type(screen.getByTestId("external-services-body-editor"), "event={{event_type}}");
    await user.click(screen.getByText("Params"));
    await user.click(screen.getAllByRole("button", { name: "Добавить строку" })[0]!);
    expect(onChange).toHaveBeenCalled();
    await user.click(screen.getByText("Triggers"));
    await user.click(screen.getByTestId("external-services-trigger-call_answered"));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ triggers: [] }));
    await user.click(screen.getByTestId("external-services-save"));
    await user.click(screen.getByRole("button", { name: "Действия запроса" }));
    await user.click(screen.getByRole("menuitem", { name: "Удалить" }));
    expect(screen.getByTestId("external-services-run-now")).toBeEnabled();
    await user.click(screen.getByTestId("external-services-run-now"));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onRunNow).toHaveBeenCalledOnce();
  });

  it("disables send when URL is empty and enables when URL is filled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <ExternalServicesRequestEditor
        collectionName="CRM"
        draft={{ ...draft, url: "" }}
        busy={false}
        errorMessage={null}
        runState="idle"
        runResult={null}
        journal={journal}
        onChange={onChange}
        onSave={vi.fn()}
        onRunNow={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByTestId("external-services-run-now")).toBeDisabled();
    rerender(
      <ExternalServicesRequestEditor
        collectionName="CRM"
        draft={draft}
        busy={false}
        errorMessage={null}
        runState="idle"
        runResult={null}
        journal={journal}
        onChange={onChange}
        onSave={vi.fn()}
        onRunNow={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByTestId("external-services-run-now")).toBeEnabled();
    await user.hover(screen.getByTestId("external-services-run-now"));
  });

  it.each([
    ["success", "success", 204, "", false, "valid"],
    ["http", "error", 422, "{\"error\":\"invalid\"}", false, "valid"],
    ["network", "error", null, "", false, "not_applicable"],
    ["timeout", "error", null, "", false, "not_applicable"],
    ["aborted", "error", null, "", false, "not_applicable"],
    ["validation", "error", null, "", true, "invalid"],
  ] as const)(
    "renders %s manual run result feedback",
    (category, kind, status, body, bodyTruncated, jsonValidity) => {
      render(
        <ExternalServicesRunResult
          runState="idle"
          result={{
            kind,
            ...(category === "success" ? {} : { category }),
            status,
            durationMs: 25,
            body,
            bodyTruncated,
            jsonValidity,
          }}
        />,
      );
      expect(screen.getByTestId("external-services-run-result")).toHaveTextContent("25 мс");
    },
  );

  it("shows queued and running manual run feedback", () => {
    const { rerender } = render(<ExternalServicesRunResult result={null} runState="queued" />);
    expect(screen.getByTestId("external-services-run-progress")).toHaveTextContent("Запрос поставлен в очередь");
    rerender(<ExternalServicesRunResult result={null} runState="running" />);
    expect(screen.getByTestId("external-services-run-progress")).toHaveTextContent("Запрос выполняется");
  });
});
