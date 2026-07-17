/**
 * - Purpose: pick hostname for GET /proxy/authenticate (OCP proxy), never SIP PBX host.
 * - Inputs: settings/profile/session OCP domains + optional SIP account domain for pollution detect.
 * - Outputs: trimmed OCP proxy domain or empty when none usable.
 *
 * `entity:creds`.domain is the SIP identity host and must not drive HTTP authenticate.
 */

export type ResolveOcpProxyAuthenticateDomainInput = Readonly<{
  settingsOcpDomain: string;
  profileOcpDomain?: string;
  sessionOcpDomain?: string | null;
  /** Active SIP account domain — used only to detect settings polluted by creds. */
  sipAccountDomain?: string | null;
}>;

/**
 * - Purpose: resolve OCP proxy hostname for fresh-token HTTP authenticate / reconnect.
 * - Inputs: candidate OCP domains + SIP domain for pollution guard.
 * - Outputs: preferred non-empty OCP domain string (may be empty when unresolved).
 */
export function resolveOcpProxyAuthenticateDomain(
  input: ResolveOcpProxyAuthenticateDomainInput,
): string {
  const settings = input.settingsOcpDomain.trim();
  const profile = (input.profileOcpDomain ?? "").trim();
  const session = (input.sessionOcpDomain ?? "").trim();
  const sip = (input.sipAccountDomain ?? "").trim();

  // Settings may have been overwritten with entity:creds SIP host — heal from profile/session.
  const settingsLooksLikeSipHost =
    settings.length > 0 && sip.length > 0 && settings === sip;
  if (settingsLooksLikeSipHost) {
    if (profile.length > 0 && profile !== sip) {
      return profile;
    }
    if (session.length > 0 && session !== sip) {
      return session;
    }
  }

  if (settings.length > 0) {
    return settings;
  }
  if (profile.length > 0) {
    return profile;
  }
  if (session.length > 0) {
    return session;
  }
  return "";
}
