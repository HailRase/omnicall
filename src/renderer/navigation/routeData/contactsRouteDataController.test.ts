import { describe, expect, it } from "vitest";
import type { ContactsProjection } from "@application/projections/contacts/contactsProjection.js";
import {
  isContactRouteLoadFailureCode,
  resolveContactRouteInitialStatus,
  resolveContactsRouteLoadTarget,
  shouldStartContactsListLoad,
} from "./contactsRouteDataController.js";
import { resolveHistoryRouteLoadTarget } from "./historyEntryRouteDataController.js";

const sampleProjectionContact: ContactsProjection["contacts"][number] = {
  id: "agent-1" as ContactsProjection["contacts"][number]["id"],
  displayName: "Agent",
  primaryPhone: "+1",
  secondaryPhone: null,
  company: null,
  notes: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("contactsRouteDataController", () => {
  it("resolves contacts list target", () => {
    expect(resolveContactsRouteLoadTarget({ name: "contacts" })).toEqual({ kind: "list" });
  });

  it("resolves contact details target", () => {
    expect(
      resolveContactsRouteLoadTarget({
        name: "contactDetails",
        contactId: "agent-1",
        notFound: false,
      }),
    ).toEqual({
      kind: "contact",
      contactId: "agent-1",
      routeNotFound: false,
      isCreateRoute: false,
    });
  });

  it("marks invalid contact route as not found without facade intent", () => {
    const status = resolveContactRouteInitialStatus({
      routeNotFound: true,
      isCreateRoute: false,
      projectionContact: null,
    });

    expect(status).toBe("notFound");
  });

  it("uses projection contact without loading when already present", () => {
    const status = resolveContactRouteInitialStatus({
      routeNotFound: false,
      isCreateRoute: false,
      projectionContact: sampleProjectionContact,
    });

    expect(status).toBe("loaded");
  });

  it("skips list load while in flight", () => {
    expect(shouldStartContactsListLoad({ inFlight: true })).toBe(false);
    expect(shouldStartContactsListLoad({ inFlight: false })).toBe(true);
  });

  it("classifies contact load failure codes", () => {
    expect(isContactRouteLoadFailureCode("not_found")).toBe(true);
    expect(isContactRouteLoadFailureCode("validation_failed")).toBe(true);
    expect(isContactRouteLoadFailureCode("internal_error")).toBe(false);
  });
});

describe("historyRouteDataController", () => {
  it("resolves history list target", () => {
    expect(resolveHistoryRouteLoadTarget({ name: "history" })).toEqual({ kind: "list" });
    expect(
      resolveHistoryRouteLoadTarget({
        name: "historyDetails",
        entryId: "history-call-1",
        notFound: false,
      }),
    ).toEqual({
      kind: "entry",
      entryId: "history-call-1",
      routeNotFound: false,
    });
    expect(resolveHistoryRouteLoadTarget({ name: "dialpad" })).toEqual({ kind: "none" });
  });
});
