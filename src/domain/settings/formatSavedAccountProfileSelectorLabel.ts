import type { SavedAccountProfile } from "./SavedAccountProfile.js";
import { normalizeSipDomain } from "../telephony/SipAccount.js";

/**
 * - Purpose: build saved-profile selector label with username disambiguation.
 * - Inputs: target profile and full saved profile list.
 * - Outputs: username, or username@domain, or username@domain (server) when ambiguous.
 */
export function formatSavedAccountProfileSelectorLabel(
  profile: SavedAccountProfile,
  allProfiles: ReadonlyArray<SavedAccountProfile>,
): string {
  const username = profile.username.trim();
  const duplicateUsernames = countMatchingProfiles(
    allProfiles,
    (candidate) => candidate.username.trim() === username,
  );

  if (duplicateUsernames <= 1) {
    return username;
  }

  const domain = normalizeSipDomain(profile.domain) || profile.domain.trim();
  const withDomain = `${username} @ ${domain}`;
  const duplicateUsernameDomain = countMatchingProfiles(
    allProfiles,
    (candidate) =>
      candidate.username.trim() === username &&
      (normalizeSipDomain(candidate.domain) || candidate.domain.trim()) === domain,
  );

  if (duplicateUsernameDomain <= 1) {
    return withDomain;
  }

  return `${withDomain} (${profile.server.trim()})`;
}

function countMatchingProfiles(
  profiles: ReadonlyArray<SavedAccountProfile>,
  predicate: (profile: SavedAccountProfile) => boolean,
): number {
  let count = 0;
  for (const profile of profiles) {
    if (predicate(profile)) {
      count += 1;
    }
  }
  return count;
}
