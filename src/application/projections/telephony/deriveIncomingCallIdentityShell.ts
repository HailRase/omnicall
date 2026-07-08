import type { Contact, ContactId } from "@domain/index.js";
import {
  buildContactDirectory,
  type CallerPresentationSource,
} from "../../read-models/contactDirectory.js";
import type { IncomingCallProjection } from "./incomingCallProjection.js";

export type IncomingCallIdentityShellViewModel = Readonly<{
  displayName: string | null;
  callerNumber: string | null;
  primaryLabel: string;
  secondaryLabel: string | null;
  contactId: ContactId | null;
  presentationSource: CallerPresentationSource;
}>;

/**
 * - Purpose: enrich incoming call identity for overlay, session card, and controls.
 * - Inputs: incoming call projection and loaded contacts for active account.
 * - Outputs: caller presentation fields shared across active-call shell surfaces.
 */
export function deriveIncomingCallIdentityShell(input: Readonly<{
  projection: IncomingCallProjection;
  contacts: ReadonlyArray<Contact>;
}>): IncomingCallIdentityShellViewModel {
  const contactDirectory = buildContactDirectory(input.contacts);
  const presentation = contactDirectory.resolvePresentation({
    remoteNumber: input.projection.callerNumber ?? "",
    displayLabel: input.projection.displayName,
  });

  const displayName =
    presentation.primaryLabel.length > 0 ? presentation.primaryLabel : null;
  const callerNumber =
    presentation.secondaryLabel ?? input.projection.callerNumber;

  return {
    displayName,
    callerNumber,
    primaryLabel: presentation.primaryLabel,
    secondaryLabel: presentation.secondaryLabel,
    contactId: presentation.contactId,
    presentationSource: presentation.source,
  };
}
