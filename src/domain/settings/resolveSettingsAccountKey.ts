import {
  ANONYMOUS_SETTINGS_ACCOUNT,
  createSettingsAccountKey,
  type SettingsAccountKey,
} from "./SettingsAccountKey.js";
import type { SipAccount } from "../telephony/SipAccount.js";

/**
 * - Purpose: derive settings storage key from SIP account identity.
 * - Inputs: current SIP account or null for anonymous bucket.
 * - Outputs: branded SettingsAccountKey.
 */
export function resolveSettingsAccountKeyFromSipAccount(
  account: SipAccount | null,
): SettingsAccountKey {
  if (account === null) {
    return createSettingsAccountKey(ANONYMOUS_SETTINGS_ACCOUNT);
  }
  return createSettingsAccountKey(account.username);
}
