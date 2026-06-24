import type { SipAccountInput } from "@domain/index.js";

/**
 * - Purpose: read optional SIP form defaults from Vite env (.env.local).
 * - Inputs: import.meta.env VITE_SIP_* variables.
 * - Outputs: partial SipAccountInput for AccountPanel prefill.
 */
export function readSipEnvDefaults(): Partial<SipAccountInput> {
  const env = import.meta.env;

  return {
    ...(typeof env.VITE_SIP_REGISTRAR === "string" && env.VITE_SIP_REGISTRAR.length > 0
      ? { registrar: env.VITE_SIP_REGISTRAR }
      : {}),
    ...(typeof env.VITE_SIP_USERNAME === "string" && env.VITE_SIP_USERNAME.length > 0
      ? { username: env.VITE_SIP_USERNAME }
      : {}),
    ...(typeof env.VITE_SIP_PASSWORD === "string" && env.VITE_SIP_PASSWORD.length > 0
      ? { password: env.VITE_SIP_PASSWORD }
      : {}),
    ...(typeof env.VITE_SIP_URI === "string" && env.VITE_SIP_URI.length > 0
      ? { uri: env.VITE_SIP_URI }
      : {}),
    ...(typeof env.VITE_SIP_DISPLAY_NAME === "string" && env.VITE_SIP_DISPLAY_NAME.length > 0
      ? { displayName: env.VITE_SIP_DISPLAY_NAME }
      : {}),
  };
}
