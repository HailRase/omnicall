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
        />
      </ContactsPanelShell>,
    );

    expect(screen.getByTestId("contacts-list-error")).toHaveTextContent(
      "Не удалось загрузить контакты.",
    );
  });

  it("renders populated list and routes selection", () => {
    const onSelectContact = vi.fn();

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
            },
          ]}
          onSelectContact={onSelectContact}
          onAddContact={vi.fn()}
        />
      </ContactsPanelShell>,
    );

    fireEvent.click(screen.getByTestId("contacts-list-item-agent-1"));
    expect(onSelectContact).toHaveBeenCalledWith("agent-1");
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
