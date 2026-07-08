import type { AppBootstrapConfig } from "@application/index.js";
import {
  resolveAdapterMode,
  type AdapterMode,
} from "@infrastructure/bootstrap/adapterMode.js";

type MockTelephonyScenario = "success" | "failure";

export type RendererBootstrapOptions = Readonly<{
  config: AppBootstrapConfig;
  adapterMode: AdapterMode;
  telephonyScenario: MockTelephonyScenario;
}>;

const TELEPHONY_SCENARIOS: ReadonlyArray<MockTelephonyScenario> = [
  "success",
  "failure",
];

export function readBootstrapConfigFromUrl(): RendererBootstrapOptions {
  const params = new URLSearchParams(window.location.search);
  const adapterMode = resolveAdapterMode({
    urlAdaptersParam: params.get("adapters"),
    envAdapterMode: import.meta.env.VITE_ADAPTER_MODE,
  });
  const telephonyScenarioParam = params.get("telephonyScenario") ?? "success";

  const telephonyScenario = TELEPHONY_SCENARIOS.includes(
    telephonyScenarioParam as MockTelephonyScenario,
  )
    ? (telephonyScenarioParam as MockTelephonyScenario)
    : "success";

  return {
    config: {},
    adapterMode,
    telephonyScenario,
  };
}
