/**
 * - Purpose: validate renderer requests for native Electron theme source.
 * - Inputs: unknown IPC payload from preload/renderer boundary.
 * - Outputs: typed theme request { theme } or null when invalid.
 */
export type SetNativeThemePayload = Readonly<{
  theme: "light" | "dark";
}>;

export type SetNativeThemeResponse = Readonly<{
  ok: boolean;
}>;

/**
 * - Purpose: narrow unknown values to a supported native theme payload.
 * - Inputs: unknown value from untyped IPC invocation.
 * - Outputs: SetNativeThemePayload on success, otherwise null.
 */
export function parseSetNativeThemePayload(value: unknown): SetNativeThemePayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const theme = (value as Record<string, unknown>)["theme"];
  if (theme !== "light" && theme !== "dark") {
    return null;
  }

  return { theme };
}
