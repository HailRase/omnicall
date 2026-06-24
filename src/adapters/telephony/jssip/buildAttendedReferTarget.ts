/**
 * - Purpose: extract SIP URI target for attended REFER from remote identity header.
 * - Inputs: JsSIP remote identity header string.
 * - Outputs: sip URI suitable for Refer-To target.
 */
export function buildAttendedReferTarget(remoteIdentityHeader: string): string {
  const angleMatch = remoteIdentityHeader.match(/<([^>]+)>/);
  if (angleMatch?.[1] !== undefined) {
    return angleMatch[1];
  }

  const trimmed = remoteIdentityHeader.trim();
  if (trimmed.toLowerCase().startsWith("sip:")) {
    return trimmed;
  }

  return trimmed;
}
