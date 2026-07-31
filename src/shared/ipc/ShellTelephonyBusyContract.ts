/**
 * Typed IPC payload: renderer → main telephony busy mirror for SDK hide policy.
 */

export type ShellTelephonyBusyPayload = Readonly<{
  busy: boolean;
}>;

export function parseShellTelephonyBusyPayload(
  value: unknown,
): ShellTelephonyBusyPayload | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record["busy"] !== "boolean") {
    return null;
  }
  return { busy: record["busy"] };
}
