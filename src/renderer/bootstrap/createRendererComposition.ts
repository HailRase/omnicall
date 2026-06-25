import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { createSoftphoneComposition } from "@infrastructure/bootstrap/createSoftphoneComposition.js";
import { readBootstrapConfigFromUrl } from "./readBootstrapConfig.js";
import type { RendererBootstrapOptions } from "./readBootstrapConfig.js";

type RendererComposition = Readonly<{
  facade: AccountBootstrapFacade;
  bootstrapOptions: RendererBootstrapOptions;
}>;

/**
 * - Purpose: create renderer composition root from URL/env bootstrap options.
 * - Inputs: browser location search params and Vite env defaults.
 * - Outputs: account bootstrap facade and resolved bootstrap options.
 */
export function createRendererComposition(): RendererComposition {
  const bootstrapOptions = readBootstrapConfigFromUrl();
  const facade = createSoftphoneComposition({
    mode: bootstrapOptions.adapterMode,
    bootstrapConfig: bootstrapOptions.config,
    ocpScenario: bootstrapOptions.ocpScenario,
    telephonyScenario: bootstrapOptions.telephonyScenario,
    ...(bootstrapOptions.ocpWsUrl !== undefined ? { ocpWsUrl: bootstrapOptions.ocpWsUrl } : {}),
  });

  return { facade, bootstrapOptions };
}
