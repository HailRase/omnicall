import type { AppBootstrapConfig } from "@application/index.js";
import {
  resolveAdapterMode,
  type AdapterMode,
} from "@infrastructure/bootstrap/adapterMode.js";

type MockOcpScenario =
  | "success"
  | "session_exists"
  | "invalid_token"
  | "access_denied"
  | "network_error";

type MockTelephonyScenario = "success" | "failure";

export type RendererBootstrapOptions = Readonly<{
  config: AppBootstrapConfig;
  adapterMode: AdapterMode;
  ocpScenario: MockOcpScenario;
  telephonyScenario: MockTelephonyScenario;
}>;

const OCP_SCENARIOS: ReadonlyArray<MockOcpScenario> = [
  "success",
  "session_exists",
  "invalid_token",
  "access_denied",
  "network_error",
];

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
  const mode = params.get("mode") === "ocp" ? "ocp" : "sip-only";
  const ocpToken = params.get("token") ?? undefined;
  const ocpDomain = params.get("domain") ?? undefined;
  const ocpScenarioParam = params.get("ocpScenario") ?? "success";
  const telephonyScenarioParam = params.get("telephonyScenario") ?? "success";

  const ocpScenario = OCP_SCENARIOS.includes(ocpScenarioParam as MockOcpScenario)
    ? (ocpScenarioParam as MockOcpScenario)
    : "success";

  const telephonyScenario = TELEPHONY_SCENARIOS.includes(
    telephonyScenarioParam as MockTelephonyScenario,
  )
    ? (telephonyScenarioParam as MockTelephonyScenario)
    : "success";

  if (mode === "ocp") {
    return {
      config: {
        mode,
        ...(ocpToken !== undefined ? { ocpToken } : {}),
        ...(ocpDomain !== undefined ? { ocpDomain } : {}),
      },
      adapterMode,
      ocpScenario,
      telephonyScenario,
    };
  }

  return {
    config: { mode: "sip-only" },
    adapterMode,
    ocpScenario,
    telephonyScenario,
  };
}
