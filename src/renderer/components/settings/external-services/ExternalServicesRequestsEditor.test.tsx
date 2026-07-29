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
  it("renders the requests empty state and request badges with a fast toggle", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { rerender } = render(
      <ExternalServicesRequestsView
        collection={{ id: "collection", name: "CRM", enabled: true, enabledRequestCount: 0, requestCount: 0, variables: [] }}
        requests={[]}
        busy={false}
        onBack={vi.fn()}
        onCreate={vi.fn()}
        onOpen={vi.fn()}
        onToggle={onToggle}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Запросов пока нет")).toBeInTheDocument();

    rerender(
      <ExternalServicesRequestsView
        collection={{ id: "collection", name: "CRM", enabled: true, enabledRequestCount: 1, requestCount: 1, variables: [] }}
        requests={[{ id: draft.id, name: draft.name, enabled: true, method: "POST" }]}
        busy={false}
        onBack={vi.fn()}
        onCreate={vi.fn()}
        onOpen={vi.fn()}
        onToggle={onToggle}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("POST")).toBeInTheDocument();
    expect(screen.getByTestId(`external-services-request-status-${draft.id}`)).toHaveTextContent("Включён");
    await user.click(screen.getByTestId(`external-services-request-toggle-${draft.id}`));
    expect(onToggle).toHaveBeenCalledWith(draft.id, false);
  });

  it("emits editor field, table, trigger, save, delete, and discard intents", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSave = vi.fn();
    const onDelete = vi.fn();
    const onBack = vi.fn();
    const onRunNow = vi.fn();
    render(
      <ExternalServicesRequestEditor
        draft={draft}
        busy={false}
        errorMessage={null}
        isDirty
        runState="idle"
        runResult={null}
        onBack={onBack}
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
    await user.click(screen.getByTestId("external-services-body-mode"));
    await user.click(screen.getByText("Текст"));
    await user.clear(screen.getByTestId("external-services-body-editor"));
    await user.type(screen.getByTestId("external-services-body-editor"), "event={{event_type}}");
    await user.click(screen.getAllByRole("button", { name: "Добавить строку" })[0]!);
    expect(onChange).toHaveBeenCalled();
    await user.click(screen.getByTestId("external-services-trigger-call_answered"));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ triggers: [] }));
    await user.click(screen.getByTestId("external-services-save"));
    await user.click(screen.getByRole("button", { name: "Удалить" }));
    await user.click(screen.getByTestId("external-services-run-now"));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onRunNow).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Назад" }));
    expect(screen.getByText("Отменить изменения?")).toBeInTheDocument();
    await user.click(screen.getByTestId("external-services-discard-changes"));
    expect(onBack).toHaveBeenCalledOnce();
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
