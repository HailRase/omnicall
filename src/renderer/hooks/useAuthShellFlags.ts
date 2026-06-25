import { deriveAuthShellFlags } from "@application/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

/**
 * - Purpose: expose auth shell visibility flags from bootstrap projection.
 * - Inputs: account bootstrap projection from store selector.
 * - Outputs: panel visibility and blocking auth state flags.
 */
export function useAuthShellFlags(): ReturnType<typeof deriveAuthShellFlags> {
  const projection = useAccountBootstrapStore((state) => state.projection);
  return deriveAuthShellFlags(projection);
}
