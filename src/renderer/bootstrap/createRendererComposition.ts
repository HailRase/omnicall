import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { createSoftphoneComposition } from "@infrastructure/bootstrap/createSoftphoneComposition.js";
import { PreloadContactCsvFileGateway } from "@adapters/platform/PreloadContactCsvFileGateway.js";
import { readBootstrapConfigFromUrl } from "./readBootstrapConfig.js";
import type { RendererBootstrapOptions } from "./readBootstrapConfig.js";
import { resolveRealBootstrapDiskOptions } from "./resolveRealBootstrapDiskOptions.js";

type RendererComposition = Readonly<{
  facade: AccountBootstrapFacade;
  bootstrapOptions: RendererBootstrapOptions;
}>;

/**
 * - Purpose: create renderer composition root from URL/env bootstrap options.
 * - Inputs: browser location search params, Vite env defaults, preload storage root.
 * - Outputs: account bootstrap facade and resolved bootstrap options.
 */
export async function createRendererComposition(): Promise<RendererComposition> {
  const bootstrapOptions = readBootstrapConfigFromUrl();
  const diskOptions = await resolveRealBootstrapDiskOptions(bootstrapOptions.adapterMode);
  const contactCsvFileGateway =
    bootstrapOptions.adapterMode === "real" ? new PreloadContactCsvFileGateway() : undefined;
  const facade = createSoftphoneComposition({
    mode: bootstrapOptions.adapterMode,
    bootstrapConfig: bootstrapOptions.config,
    telephonyScenario: bootstrapOptions.telephonyScenario,
    ...diskOptions,
    ...(contactCsvFileGateway !== undefined ? { contactCsvFileGateway } : {}),
  });

  return { facade, bootstrapOptions };
}
