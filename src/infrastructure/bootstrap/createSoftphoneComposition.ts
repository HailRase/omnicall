import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { AdapterMode } from "./adapterMode.js";
import {
  createMockAccountBootstrap,
  type CreateAccountBootstrapOptions,
} from "./createMockAccountBootstrap.js";
import { createRealAccountBootstrap } from "./createRealAccountBootstrap.js";

/**
 * - Purpose: single dispatcher selecting mock or real AccountBootstrapFacade wiring.
 * - Inputs: adapter mode plus mock bootstrap scenario options.
 * - Outputs: AccountBootstrapFacade for the selected adapter mode.
 */
export type CreateSoftphoneCompositionOptions = CreateAccountBootstrapOptions &
  Readonly<{
    mode: AdapterMode;
  }>;

export function createSoftphoneComposition(
  options: CreateSoftphoneCompositionOptions,
): AccountBootstrapFacade {
  if (options.mode === "real") {
    return createRealAccountBootstrap(options);
  }

  return createMockAccountBootstrap(options);
}
