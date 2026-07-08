import { DEFAULT_SETTINGS_SECTION } from "../components/settings/settingsSections.js";
import type { ShellRoute } from "./shellRouteModel.js";

/**
 * - Purpose: map typed shell routes to hash-router paths.
 * - Inputs: validated shell route union.
 * - Outputs: absolute in-app path segment.
 */
export function shellRouteToPath(route: ShellRoute): string {
  switch (route.name) {
    case "dialpad":
      return "/";
    case "history":
      return "/history";
    case "historyDetails":
      return `/history/${encodeURIComponent(route.entryId)}`;
    case "contacts":
      return "/contacts";
    case "contactDetails":
      return `/contacts/${encodeURIComponent(route.contactId)}`;
    case "contactEdit":
      return `/contacts/${encodeURIComponent(route.contactId)}/edit`;
    case "settings": {
      const section = route.section ?? DEFAULT_SETTINGS_SECTION;
      if (section === DEFAULT_SETTINGS_SECTION) {
        return "/settings";
      }
      return `/settings/${section}`;
    }
  }
}
