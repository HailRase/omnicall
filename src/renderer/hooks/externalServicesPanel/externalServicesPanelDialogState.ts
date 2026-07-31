/**
 * - Purpose: dialog state shapes for External Services panel chrome.
 * - Inputs: none.
 * - Outputs: name/delete dialog types and closed-name default.
 */

import type {
  ExternalServicesNameDialogMode,
  ExternalServicesNameDialogScope,
} from "../../components/settings/external-services/ExternalServicesCollectionsDialogs.js";
import type { TranslationKey } from "../../i18n/index.js";

export type NameDialogState = Readonly<{
  open: boolean;
  mode: ExternalServicesNameDialogMode;
  scope: ExternalServicesNameDialogScope;
  collectionId: string | null;
  requestId: string | null;
  value: string;
  errorKey: TranslationKey | null;
}>;

export type DeleteDialogState = Readonly<{
  open: boolean;
  collectionId: string | null;
  collectionName: string;
}>;

export const CLOSED_NAME_DIALOG: NameDialogState = {
  open: false,
  mode: "create",
  scope: "collection",
  collectionId: null,
  requestId: null,
  value: "",
  errorKey: null,
};
