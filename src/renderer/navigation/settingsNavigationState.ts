type SettingsNavigationStateShape = Readonly<{
  settingsReturnTo?: unknown;
}>;

function asSettingsNavigationState(state: unknown): SettingsNavigationStateShape | null {
  if (typeof state !== "object" || state === null) {
    return null;
  }

  return state;
}

/**
 * - Purpose: validate optional router location state for settings overlay return targets.
 * - Inputs: unknown router location state payload.
 * - Outputs: safe prior shell path or null when missing or invalid.
 */
export function readSettingsReturnTo(state: unknown): string | null {
  const parsed = asSettingsNavigationState(state);
  if (parsed === null) {
    return null;
  }

  const returnTo = parsed.settingsReturnTo;
  if (typeof returnTo !== "string" || returnTo.trim().length === 0) {
    return null;
  }

  return returnTo;
}

/**
 * - Purpose: build router state that preserves the shell destination before settings open.
 * - Inputs: current pathname and optional existing router state.
 * - Outputs: location state with validated settings return target.
 */
export function createSettingsNavigationState(
  currentPathname: string,
  existingState: unknown,
): Readonly<{ settingsReturnTo: string }> | undefined {
  if (currentPathname.startsWith("/settings")) {
    const preservedReturnTo = readSettingsReturnTo(existingState);
    return preservedReturnTo !== null ? { settingsReturnTo: preservedReturnTo } : undefined;
  }

  return { settingsReturnTo: currentPathname };
}
