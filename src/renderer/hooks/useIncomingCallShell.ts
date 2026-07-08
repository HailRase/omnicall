import { useMemo } from "react";
import type { IncomingCallProjection } from "@application/index.js";
import { deriveIncomingCallIdentityShell } from "@application/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

type UseIncomingCallShellInput = Readonly<{
  incomingCallProjection: IncomingCallProjection;
}>;

type UseIncomingCallShellResult = Readonly<{
  identity: ReturnType<typeof deriveIncomingCallIdentityShell>;
}>;

/**
 * - Purpose: compose incoming call presentation from projections.
 * - Inputs: incoming call projection.
 * - Outputs: identity shell for incoming card.
 */
export function useIncomingCallShell(
  input: UseIncomingCallShellInput,
): UseIncomingCallShellResult {
  const { incomingCallProjection } = input;
  const contacts = useAccountBootstrapStore((state) => state.contactsProjection.contacts);

  const identity = useMemo(
    () =>
      deriveIncomingCallIdentityShell({
        projection: incomingCallProjection,
        contacts,
      }),
    [contacts, incomingCallProjection],
  );

  return {
    identity,
  };
}
