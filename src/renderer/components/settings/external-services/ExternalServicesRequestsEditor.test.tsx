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
        onRename={vi.fn()}
      />,
    );
    expect(screen.getByText("Коллекция пуста")).toBeInTheDocument();
    expect(screen.getByTestId("external-services-collection-variables")).toBeInTheDocument();
    expect(
      screen.getByText(/Общие значения коллекции/, { exact: false }),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId("external-services-create-request"));
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("shows collection variable tokens in the selected-collection preview", () => {
    render(
      <ExternalServicesRequestsView
        collection={{
          id: "collection",
          name: "CRM",
          enabled: true,
          enabledRequestCount: 1,
          requestCount: 1,
          variables: [{ key: "base_url", value: "https://crm.example.test" }],
        }}
        busy={false}
        journal={journal}
        onCreate={vi.fn()}
        onEditVariables={vi.fn()}
        onRename={vi.fn()}
      />,
    );
    expect(screen.getByText("{{base_url}}")).toBeInTheDocument();
    expect(screen.getByText("https://crm.example.test")).toBeInTheDocument();
  });

  it("shows system variables catalog and inserts token into URL", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
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
        onCommitName={vi.fn()}
        onSave={vi.fn()}
        onRunNow={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("external-services-url-template-hint")).not.toBeInTheDocument();
    await user.click(screen.getByText("Variables"));
    expect(screen.getByTestId("external-services-system-variables")).toBeInTheDocument();
    expect(screen.getByTestId("external-services-variable-call_id")).toBeInTheDocument();
    expect(screen.getByText("ID звонка")).toBeInTheDocument();
    await user.click(screen.getByTestId("external-services-variable-insert-call_id"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://crm.example/events{{call_id}}" }),
    );
  });

  it("inserts token into body when body is focused", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
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
        onCommitName={vi.fn()}
        onSave={vi.fn()}
        onRunNow={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await user.click(screen.getByText("Body"));
    await user.click(screen.getByTestId("external-services-body-editor"));
    await user.click(screen.getByText("Variables"));
    await user.click(screen.getByTestId("external-services-variable-insert-caller_id"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ value: "{\"event\":\"call\"}{{caller_id}}" }),
      }),
    );
  });

  it("emits editor field, table, trigger, save, delete, and send intents", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSave = vi.fn();
    const onDelete = vi.fn();
    const onRunNow = vi.fn();
    const onCommitName = vi.fn();
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
        onCommitName={onCommitName}
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
    await user.click(screen.getByTestId("external-services-body-mode-raw"));
    await user.clear(screen.getByTestId("external-services-body-editor"));
    await user.type(screen.getByTestId("external-services-body-editor"), "event={{event_type}}");
    await user.click(screen.getByRole("tab", { name: /Params/ }));
    await user.click(screen.getAllByRole("button", { name: "Добавить строку" })[0]!);
    expect(onChange).toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: /Triggers/ }));
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

  it("commits breadcrumb rename on blur", async () => {
    const user = userEvent.setup();
    const onCommitName = vi.fn();
    render(
      <ExternalServicesRequestEditor
        collectionName="CRM"
        draft={draft}
        busy={false}
        errorMessage={null}
        runState="idle"
        runResult={null}
        journal={journal}
        onChange={vi.fn()}
        onCommitName={onCommitName}
        onSave={vi.fn()}
        onRunNow={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("external-services-request-name"));
    const input = screen.getByTestId("external-services-request-name");
    await user.clear(input);
    await user.type(input, "Renamed webhook");
    await user.tab();
    expect(onCommitName).toHaveBeenCalledWith("Renamed webhook");
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
        onCommitName={vi.fn()}
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
        onCommitName={vi.fn()}
        onSave={vi.fn()}
        onRunNow={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByTestId("external-services-run-now")).toBeEnabled();
    await user.hover(screen.getByTestId("external-services-run-now"));
  });

  it("hides body editor when body mode is none", async () => {
    const user = userEvent.setup();
    render(
      <ExternalServicesRequestEditor
        collectionName="CRM"
        draft={{ ...draft, body: { mode: "none", value: "" } }}
        busy={false}
        errorMessage={null}
        runState="idle"
        runResult={null}
        journal={journal}
        onChange={vi.fn()}
        onCommitName={vi.fn()}
        onSave={vi.fn()}
        onRunNow={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await user.click(screen.getByText("Body"));
    expect(screen.queryByTestId("external-services-body-editor")).not.toBeInTheDocument();
  });

  it("clears body value when switching body mode to none", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ExternalServicesRequestEditor
        collectionName="CRM"
        draft={{ ...draft, body: { mode: "json", value: "{\"a\":1}" } }}
        busy={false}
        errorMessage={null}
        runState="idle"
        runResult={null}
        journal={journal}
        onChange={onChange}
        onCommitName={vi.fn()}
        onSave={vi.fn()}
        onRunNow={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await user.click(screen.getByText("Body"));
    await user.click(screen.getByTestId("external-services-body-mode-none"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ body: { mode: "none", value: "" } }),
    );
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
