/**
 * - Purpose: derive display initials from a person label or phone number.
 * - Inputs: display name, phone number, or combined label string.
 * - Outputs: one or two uppercase initials for list avatars.
 */
export function derivePersonInitials(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length === 0) {
    return "?";
  }

  if (/^[\d+\s().-]+$/.test(trimmed)) {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length >= 2) {
      return digits.slice(-2);
    }
    if (digits.length === 1) {
      return digits;
    }
    return "?";
  }

  const parts = trimmed.split(/\s+/).filter((part) => part.length > 0);
  if (parts.length >= 2) {
    return `${parts[0]?.charAt(0) ?? ""}${parts[1]?.charAt(0) ?? ""}`.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}
