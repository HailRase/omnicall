import type { SipAccountInput } from "@application/index.js";

/**
 * - Purpose: read optional SIP form defaults from Vite env (.env.local).
 * - Inputs: import.meta.env VITE_SIP_* variables.
 * - Outputs: partial SipAccountInput for AccountPanel prefill.
 */
export function readSipEnvDefaults(): Partial<SipAccountInput> {
  const env = import.meta.env;

  return {
    ...(typeof env.VITE_SIP_SERVER === "string" && env.VITE_SIP_SERVER.length > 0
      ? { server: env.VITE_SIP_SERVER }
      : {}),
    ...(typeof env.VITE_SIP_DOMAIN === "string" && env.VITE_SIP_DOMAIN.length > 0
      ? { domain: env.VITE_SIP_DOMAIN }
      : {}),
    ...(typeof env.VITE_SIP_USERNAME === "string" && env.VITE_SIP_USERNAME.length > 0
      ? { username: env.VITE_SIP_USERNAME }
      : {}),
    ...(typeof env.VITE_SIP_PASSWORD === "string" && env.VITE_SIP_PASSWORD.length > 0
      ? { password: env.VITE_SIP_PASSWORD }
      : {}),
  };
}
