/**
 * - Purpose: persisted OCP Module preferences in UserSettings (no secrets).
 * - Inputs: unknown boundary payloads from settings JSON.
 * - Outputs: typed OcpIntegrationSettings or null when invalid.
 */

/** Max length for OCP domain hostname string in settings. */
export const MAX_OCP_DOMAIN_LENGTH = 253;

export type OcpIntegrationSettings = Readonly<{
  enabled: boolean;
  domain: string;
  autoConnect: boolean;
  /** True after at least one successful OCP authenticate+session for this account key. */
  linked: boolean;
}>;

export const OCP_INTEGRATION_DEFAULTS: OcpIntegrationSettings = {
  enabled: false,
  domain: "",
  autoConnect: false,
  linked: false,
};

/**
 * - Purpose: narrow unknown ocpIntegration blob to typed settings.
 * - Inputs: unknown field value from persisted JSON (v8 linked, or legacy autoSipAuth).
 * - Outputs: OcpIntegrationSettings or null when shape/types are invalid.
 */
export function parseOcpIntegrationSettings(
  value: unknown,
): OcpIntegrationSettings | null {
  if (value === undefined || value === null) {
    return { ...OCP_INTEGRATION_DEFAULTS };
  }
  if (typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const enabled = record["enabled"];
  const domain = record["domain"];
  const autoConnect = record["autoConnect"];

  if (typeof enabled !== "boolean") {
    return null;
  }
  if (typeof domain !== "string") {
    return null;
  }
  if (typeof autoConnect !== "boolean") {
    return null;
  }

  const linkedRaw = record["linked"];
  const linked =
    typeof linkedRaw === "boolean"
      ? linkedRaw
      : false;

  const trimmedDomain = domain.trim();
  if (trimmedDomain.length > MAX_OCP_DOMAIN_LENGTH) {
    return null;
  }

  return {
    enabled,
    domain: trimmedDomain,
    autoConnect,
    linked,
  };
}
