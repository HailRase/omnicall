import type { CreateAccountBootstrapOptions } from "./createMockAccountBootstrap.js";

/**
 * - Purpose: placeholder for real adapter composition until RAT step 02.
 * - Inputs: bootstrap options (ignored until real adapters exist).
 * - Outputs: never returns; throws typed error for renderer error state.
 */
export class RealAdapterBootstrapNotReadyError extends Error {
  readonly code = "REAL_ADAPTER_BOOTSTRAP_NOT_READY" as const;

  constructor() {
    super(
      "Real adapters are not available yet. Complete RAT step 02 (JsSIP registration) or use mock mode.",
    );
    this.name = "RealAdapterBootstrapNotReadyError";
  }
}

export function createRealAccountBootstrap(
  options: CreateAccountBootstrapOptions = {},
): never {
  void options;
  throw new RealAdapterBootstrapNotReadyError();
}
