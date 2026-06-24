import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  createMockAccountBootstrap,
  type CreateAccountBootstrapOptions,
} from "./createMockAccountBootstrap.js";

export type { CreateAccountBootstrapOptions };

/**
 * - Purpose: backward-compatible alias to mock AccountBootstrapFacade composition.
 * - Inputs: optional bootstrap config and mock adapter scenario overrides.
 * - Outputs: wired mock AccountBootstrapFacade ready for initialize().
 */
export function createAccountBootstrap(
  options: CreateAccountBootstrapOptions = {},
): AccountBootstrapFacade {
  return createMockAccountBootstrap(options);
}
