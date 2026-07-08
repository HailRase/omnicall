// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InMemoryContactRepository } from "@adapters/settings/InMemoryContactRepository.js";
import type { ContactsProjection } from "@application/projections/contacts/contactsProjection.js";
import { initialContactsProjection } from "@application/projections/contacts/contactsProjection.js";
import { initialMultiCallProjection } from "@application/projections/telephony/multiCallProjection.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useContactEditShell, NEW_CONTACT_ROUTE_ID } from "./useContactEditShell.js";
import type { UseContactActionsResult } from "./useContactActions.js";
import { useShellRouteDataStore } from "../navigation/routeData/useShellRouteDataStore.js";
import { initialShellRouteDataState } from "../navigation/routeData/shellRouteDataModel.js";

function createActions(): UseContactActionsResult {
  return {
    loadContacts: vi.fn(),
    getContact: vi.fn(),
    createContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
    callContact: vi.fn(),
  };
}

function setContactsProjection(contacts: ContactsProjection["contacts"]): void {
  useAccountBootstrapStore.setState({
    contactsProjection: {
      ...initialContactsProjection(),
      status: "populated",
      contacts,
    },
    multiCallProjection: initialMultiCallProjection(),
  });
}

describe("useContactEditShell", () => {
  it("does not overwrite user edits when contacts projection refreshes", async () => {
    const repository = new InMemoryContactRepository();
    const contact = await repository.createContact({
      displayName: "Original Name",
      primaryPhone: "+12025550100",
    });

    useShellRouteDataStore.setState({
      ...initialShellRouteDataState(),
      activeContact: {
        contactId: contact.id,
        status: "loaded",
        activeToken: 1,
        snapshot: null,
      },
    });
    setContactsProjection([contact]);

    const { result, rerender } = renderHook(() =>
      useContactEditShell({
        contactId: contact.id,
        routeNotFound: false,
        actions: createActions(),
      }),
    );

    result.current.onFieldChange("displayName", "Edited Name");

    setContactsProjection([
      {
        ...contact,
        displayName: "Projection Refresh",
        company: "Updated Co",
        notes: "Updated notes",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);

    rerender();

    expect(result.current.values.displayName).toBe("Edited Name");
  });

  it("initializes empty form for create route", () => {
    useShellRouteDataStore.setState({
      ...initialShellRouteDataState(),
      activeContact: {
        contactId: NEW_CONTACT_ROUTE_ID,
        status: "loaded",
        activeToken: 1,
        snapshot: null,
      },
    });

    const { result } = renderHook(() =>
      useContactEditShell({
        contactId: NEW_CONTACT_ROUTE_ID,
        routeNotFound: false,
        actions: createActions(),
      }),
    );

    expect(result.current.isCreateMode).toBe(true);
    expect(result.current.values.displayName).toBe("");
    expect(result.current.isLoading).toBe(false);
  });

  it("initializes create route from history prefill route data", () => {
    useShellRouteDataStore.setState({
      ...initialShellRouteDataState(),
      activeContact: {
        contactId: NEW_CONTACT_ROUTE_ID,
        status: "loaded",
        activeToken: 1,
        snapshot: null,
      },
      contactCreatePrefill: {
        displayName: "Alice Caller",
        primaryPhone: "+12025550147",
      },
    });

    const { result } = renderHook(() =>
      useContactEditShell({
        contactId: NEW_CONTACT_ROUTE_ID,
        routeNotFound: false,
        actions: createActions(),
      }),
    );

    expect(result.current.isCreateMode).toBe(true);
    expect(result.current.values.displayName).toBe("Alice Caller");
    expect(result.current.values.primaryPhone).toBe("+12025550147");
  });
});
