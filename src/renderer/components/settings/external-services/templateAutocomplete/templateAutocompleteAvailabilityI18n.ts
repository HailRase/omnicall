/**
 * - Purpose: map template autocomplete availability ids to i18n keys.
 * - Inputs: suggestion availability id from the shared catalog helpers.
 * - Outputs: typed translation key for compact when-available labels.
 */

import type { TranslationKey } from "../../../../i18n/messages.js";
import type { TemplateAutocompleteAvailability } from "./buildTemplateAutocompleteSuggestions.js";

export const TEMPLATE_AUTOCOMPLETE_AVAILABILITY_KEYS: Readonly<
  Record<TemplateAutocompleteAvailability, TranslationKey>
> = {
  always: "settings.integrations.externalServices.variables.when.always",
  call: "settings.integrations.externalServices.variables.when.call",
  campaign: "settings.integrations.externalServices.variables.when.campaign",
  acd: "settings.integrations.externalServices.variables.when.acd",
  campaign_acd: "settings.integrations.externalServices.variables.when.campaignAndAcd",
  authored: "settings.integrations.externalServices.variables.when.always",
};
