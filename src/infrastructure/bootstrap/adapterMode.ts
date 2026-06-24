/**
 * - Purpose: adapter mode type and resolution for mock vs real composition.
 * - Inputs: optional URL adapters param and VITE_ADAPTER_MODE env value.
 * - Outputs: normalized AdapterMode with mock as safe default.
 */
export type AdapterMode = "mock" | "real";

export type ResolveAdapterModeInput = Readonly<{
  urlAdaptersParam?: string | null;
  envAdapterMode?: string | undefined;
}>;

const VALID_ADAPTER_MODES: ReadonlyArray<AdapterMode> = ["mock", "real"];

function parseAdapterMode(value: string | null | undefined): AdapterMode | null {
  if (value === undefined || value === null) {
    return null;
  }
  return VALID_ADAPTER_MODES.includes(value as AdapterMode)
    ? (value as AdapterMode)
    : null;
}

export function resolveAdapterMode(
  input: ResolveAdapterModeInput = {},
): AdapterMode {
  const fromUrl = parseAdapterMode(input.urlAdaptersParam);
  if (fromUrl !== null) {
    return fromUrl;
  }

  const fromEnv = parseAdapterMode(input.envAdapterMode);
  if (fromEnv !== null) {
    return fromEnv;
  }

  return "mock";
}
