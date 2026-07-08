import { matchPath } from "react-router-dom";
import {
  DEFAULT_SETTINGS_SECTION,
  isSettingsSectionId,
} from "../components/settings/settingsSections.js";
import { parseContactId } from "./contactIdValidation.js";
import { parseCallHistoryEntryId } from "./callHistoryEntryIdValidation.js";
import type { ParsedShellRoute } from "./shellRouteModel.js";

/**
 * - Purpose: derive typed shell route from router pathname and params.
 * - Inputs: pathname from React Router location.
 * - Outputs: parsed shell route with contact not-found flags when params are invalid.
 */
export function parseShellRoute(pathname: string): ParsedShellRoute {
  const contactEditMatch = matchPath({ path: "/contacts/:contactId/edit", end: true }, pathname);
  if (contactEditMatch !== null) {
    const rawContactId = contactEditMatch.params.contactId;
    const contactId = parseContactId(typeof rawContactId === "string" ? rawContactId : undefined);
    if (contactId === null) {
      return {
        name: "contactEdit",
        contactId: typeof rawContactId === "string" ? rawContactId : "",
        notFound: true,
      };
    }
    return { name: "contactEdit", contactId, notFound: false };
  }

  const contactDetailsMatch = matchPath({ path: "/contacts/:contactId", end: true }, pathname);
  if (contactDetailsMatch !== null) {
    const rawContactId = contactDetailsMatch.params.contactId;
    const contactId = parseContactId(typeof rawContactId === "string" ? rawContactId : undefined);
    if (contactId === null) {
      return {
        name: "contactDetails",
        contactId: typeof rawContactId === "string" ? rawContactId : "",
        notFound: true,
      };
    }
    return { name: "contactDetails", contactId, notFound: false };
  }

  if (matchPath({ path: "/contacts", end: true }, pathname) !== null) {
    return { name: "contacts" };
  }

  const settingsSectionMatch = matchPath({ path: "/settings/:sectionId", end: true }, pathname);
  if (settingsSectionMatch !== null) {
    const rawSectionId = settingsSectionMatch.params.sectionId;
    const section = isSettingsSectionId(rawSectionId)
      ? rawSectionId
      : DEFAULT_SETTINGS_SECTION;
    return { name: "settings", section };
  }

  if (matchPath({ path: "/settings", end: true }, pathname) !== null) {
    return { name: "settings", section: DEFAULT_SETTINGS_SECTION };
  }

  const historyDetailsMatch = matchPath({ path: "/history/:entryId", end: true }, pathname);
  if (historyDetailsMatch !== null) {
    const rawEntryId = historyDetailsMatch.params.entryId;
    const entryId = parseCallHistoryEntryId(typeof rawEntryId === "string" ? rawEntryId : undefined);
    if (entryId === null) {
      return {
        name: "historyDetails",
        entryId: typeof rawEntryId === "string" ? rawEntryId : "",
        notFound: true,
      };
    }
    return { name: "historyDetails", entryId, notFound: false };
  }

  if (matchPath({ path: "/history", end: true }, pathname) !== null) {
    return { name: "history" };
  }

  if (matchPath({ path: "/", end: true }, pathname) !== null) {
    return { name: "dialpad" };
  }

  return { name: "dialpad" };
}
