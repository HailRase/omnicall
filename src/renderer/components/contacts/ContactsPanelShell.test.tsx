// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setRendererLanguage } from "../../i18n/index.js";
import { ContactsListPanel, ContactDetailsPanel, ContactsPanelShell } from "./ContactsPanelShell.js";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  setRendererLanguage("ru");
});

describe("ContactsPanelShell", () => {
  it("renders localized empty state with add action", () => {
    const onAddContact = vi.fn();

    render(
      <ContactsPanelShell open title="Контакты" onClose={vi.fn()}>
        <ContactsListPanel
          isLoading={false}
          isEmpty
          errorMessage={null}
          rows={[]}
          onSelectContact={vi.fn()}
          onAddContact={onAddContact}
          onQuickCall={vi.fn()}
        />
      </ContactsPanelShell>,
    );

    expect(screen.getByTestId("contacts-list-empty")).toHaveTextContent("Список контактов пуст.");
    fireEvent.click(screen.getByTestId("contacts-add-empty"));
    expect(onAddContact).toHaveBeenCalledOnce();
  });

  it("renders loading and error states", () => {
    const { rerender } = render(
      <ContactsPanelShell open title="Контакты" onClose={vi.fn()}>
        <ContactsListPanel
          isLoading
          isEmpty={false}
          errorMessage={null}
          rows={[]}
          onSelectContact={vi.fn()}
          onAddContact={vi.fn()}
          onQuickCall={vi.fn()}
        />
      </ContactsPanelShell>,
    );

    expect(screen.getByTestId("contacts-list-loading")).toHaveTextContent("Загрузка контактов");

    rerender(
      <ContactsPanelShell open title="Контакты" onClose={vi.fn()}>
        <ContactsListPanel
          isLoading={false}
          isEmpty={false}
          errorMessage="Не удалось загрузить контакты."
          rows={[]}
          onSelectContact={vi.fn()}
          onAddContact={vi.fn()}
          onQuickCall={vi.fn()}
        />
      </ContactsPanelShell>,
    );

    expect(screen.getByTestId("contacts-list-error")).toHaveTextContent(
      "Не удалось загрузить контакты.",
    );
  });

  it("renders populated list, search, and quick call", () => {
    const onSelectContact = vi.fn();
    const onQuickCall = vi.fn();

    render(
      <ContactsPanelShell open title="Контакты" onClose={vi.fn()}>
        <ContactsListPanel
          isLoading={false}
          isEmpty={false}
          errorMessage={null}
          rows={[
            {
              id: "agent-1",
              displayName: "Alice",
              primaryPhone: "101",
              company: "Axata",
              callDisabledReason: null,
            },
            {
              id: "agent-2",
              displayName: "Bob",
              primaryPhone: "102",
              company: null,
              callDisabledReason: "Недоступно",
            },
          ]}
          onSelectContact={onSelectContact}
          onAddContact={vi.fn()}
          onQuickCall={onQuickCall}
        />
      </ContactsPanelShell>,
    );

    fireEvent.click(screen.getByTestId("contacts-list-item-agent-1"));
    expect(onSelectContact).toHaveBeenCalledWith("agent-1");

    fireEvent.click(screen.getByTestId("contacts-quick-call-agent-1"));
    expect(onQuickCall).toHaveBeenCalledWith("agent-1");
    expect(screen.getByTestId("contacts-quick-call-agent-2")).toBeDisabled();

    fireEvent.change(screen.getByTestId("contacts-search-input"), {
      target: { value: "Bob" },
    });
    expect(screen.queryByTestId("contacts-list-item-agent-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("contacts-list-item-agent-2")).toBeInTheDocument();
  });

  it("renders contact details not-found state", () => {
    render(
      <ContactsPanelShell open title="Контакт" onClose={vi.fn()}>
        <ContactDetailsPanel
          isLoading={false}
          isNotFound
          contact={null}
          onCall={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </ContactsPanelShell>,
    );

    expect(screen.getByTestId("contacts-details-not-found")).toHaveTextContent("Контакт не найден.");
  });
});
