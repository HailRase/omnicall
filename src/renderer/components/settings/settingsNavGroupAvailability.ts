import type {
  SettingsNavDisabledReasonKey,
  SettingsNavigationAvailability,
} from "@application/index.js";
import type { SettingsNavGroup, SettingsNavLeaf } from "./settingsSections.js";

/**
 * - Purpose: resolve Settings nav group enablement from availability VM.
 * - Inputs: nav group node, section availability projection.
 * - Outputs: first enabled child, blocked flag, disabled reason key.
 */

/** First leaf the availability VM allows (tree order). */
export function resolveFirstEnabledNavChild(
  group: SettingsNavGroup,
  sectionAvailability: SettingsNavigationAvailability,
): SettingsNavLeaf | undefined {
  return group.children.find(
    (child) => sectionAvailability.bySection[child.id]?.enabled === true,
  );
}

/** True only when every child is blocked (or the group has no children). */
export function isNavGroupBlocked(
  group: SettingsNavGroup,
  sectionAvailability: SettingsNavigationAvailability,
): boolean {
  return resolveFirstEnabledNavChild(group, sectionAvailability) === undefined;
}

/** Disabled reason from the first blocked child that carries a semantic key. */
export function resolveNavGroupDisabledReasonKey(
  group: SettingsNavGroup,
  sectionAvailability: SettingsNavigationAvailability,
): SettingsNavDisabledReasonKey | null {
  for (const child of group.children) {
    const availability = sectionAvailability.bySection[child.id];
    if (
      availability?.enabled === false &&
      availability.disabledReasonKey !== null &&
      availability.disabledReasonKey !== undefined
    ) {
      return availability.disabledReasonKey;
    }
  }
  return null;
}
