import type { ContactsProjection } from "@application/projections/contactsProjection.js";
import type { ParsedShellRoute } from "../shellRouteModel.js";
import type { ContactRouteSnapshot, RouteDataLoadStatus } from "./shellRouteDataModel.js";

type ProjectionContact = ContactsProjection["contacts"][number];

export type ContactsRouteLoadTarget =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "list" }>
  | Readonly<{
      kind: "contact";
      contactId: string;
      routeNotFound: boolean;
      isCreateRoute: boolean;
    }>;

/**
 * - Purpose: derive contacts route load intents from parsed shell routes.
 * - Inputs: parsed shell route.
 * - Outputs: list or single-contact load target without side effects.
 */
export function resolveContactsRouteLoadTarget(route: ParsedShellRoute): ContactsRouteLoadTarget {
  if (route.name === "contacts") {
    return { kind: "list" };
  }

  if (route.name === "contactDetails") {
    return {
      kind: "contact",
      contactId: route.contactId,
      routeNotFound: route.notFound,
      isCreateRoute: false,
    };
  }

  if (route.name === "contactEdit") {
    return {
      kind: "contact",
      contactId: route.contactId,
      routeNotFound: route.notFound,
      isCreateRoute: route.contactId === "new",
    };
  }

  return { kind: "none" };
}

export function shouldStartContactsListLoad(input: Readonly<{
  inFlight: boolean;
}>): boolean {
  return !input.inFlight;
}

export function resolveContactRouteInitialStatus(input: Readonly<{
  routeNotFound: boolean;
  isCreateRoute: boolean;
  projectionContact: ProjectionContact | null;
}>): RouteDataLoadStatus {
  if (input.routeNotFound) {
    return "notFound";
  }

  if (input.isCreateRoute) {
    return "loaded";
  }

  if (input.projectionContact !== null) {
    return "loaded";
  }

  return "loading";
}

export function mapContactToRouteSnapshot(contact: Readonly<{
  id: string;
  displayName: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  company: string | null;
  notes: string | null;
}>): ContactRouteSnapshot {
  return {
    id: contact.id,
    displayName: contact.displayName,
    primaryPhone: contact.primaryPhone,
    secondaryPhone: contact.secondaryPhone,
    company: contact.company,
    notes: contact.notes,
  };
}

export function findProjectionContact(
  projection: ContactsProjection,
  contactId: string,
): ProjectionContact | null {
  return projection.contacts.find((entry) => entry.id === contactId) ?? null;
}

export function isContactRouteLoadFailureCode(code: string): boolean {
  return code === "not_found" || code === "validation_failed";
}
