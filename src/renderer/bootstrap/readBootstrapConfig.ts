import type { AppBootstrapConfig } from "@domain/index.js";

export function readBootstrapConfigFromUrl(): AppBootstrapConfig {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") === "ocp" ? "ocp" : "sip-only";
  const ocpToken = params.get("token") ?? undefined;
  const ocpDomain = params.get("domain") ?? undefined;

  if (mode === "ocp") {
    return {
      mode,
      ...(ocpToken !== undefined ? { ocpToken } : {}),
      ...(ocpDomain !== undefined ? { ocpDomain } : {}),
    };
  }

  return { mode: "sip-only" };
}
