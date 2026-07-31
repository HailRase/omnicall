/**
 * ADR-0017 O-PII-1 mask helpers for public SDK DTOs (Application boundary).
 * Domain stays free of protocol packages.
 */

/**
 * Keep last 4 digits; replace other digits with `*`; preserve leading `+`.
 */
export function redactPhoneForSdk(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "*";
  }
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 0) {
    return "*";
  }
  if (digits.length <= 4) {
    return `${hasPlus ? "+" : ""}${digits}`;
  }
  const visible = digits.slice(-4);
  const masked = "*".repeat(digits.length - 4);
  return `${hasPlus ? "+" : ""}${masked}${visible}`;
}

/**
 * First Unicode scalar + `***`, or `*` for single-char / empty names.
 */
export function redactDisplayNameForSdk(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "*";
  }
  const chars = [...trimmed];
  if (chars.length === 1) {
    return "*";
  }
  return `${chars[0] ?? "*"}***`;
}
