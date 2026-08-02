import type { ExternalServiceVariableCatalogGroupId } from "@application/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";

/**
 * - Purpose: map External Services variable catalog ids to i18n keys.
 * - Inputs: catalog group and variable technical names.
 * - Outputs: typed translation keys for the Variables help surface.
 */

export const EXTERNAL_SERVICES_VARIABLE_GROUP_TITLE_KEYS: Readonly<
  Record<ExternalServiceVariableCatalogGroupId, TranslationKey>
> = {
  always: "settings.integrations.externalServices.variables.group.always",
  call: "settings.integrations.externalServices.variables.group.call",
  campaign: "settings.integrations.externalServices.variables.group.campaign",
  acd: "settings.integrations.externalServices.variables.group.acd",
};

export const EXTERNAL_SERVICES_VARIABLE_GROUP_WHEN_KEYS: Readonly<
  Record<ExternalServiceVariableCatalogGroupId, TranslationKey>
> = {
  always: "settings.integrations.externalServices.variables.whenHint.always",
  call: "settings.integrations.externalServices.variables.whenHint.call",
  campaign: "settings.integrations.externalServices.variables.whenHint.campaign",
  acd: "settings.integrations.externalServices.variables.whenHint.acd",
};

export const EXTERNAL_SERVICES_VARIABLE_LABEL_KEYS: Readonly<Record<string, TranslationKey>> = {
  timestamp: "settings.integrations.externalServices.variables.label.timestamp",
  event_type: "settings.integrations.externalServices.variables.label.event_type",
  user_login: "settings.integrations.externalServices.variables.label.user_login",
  call_id: "settings.integrations.externalServices.variables.label.call_id",
  caller_id: "settings.integrations.externalServices.variables.label.caller_id",
  called_id: "settings.integrations.externalServices.variables.label.called_id",
  call_direction: "settings.integrations.externalServices.variables.label.call_direction",
  hangup_reason: "settings.integrations.externalServices.variables.label.hangup_reason",
  campaign_id: "settings.integrations.externalServices.variables.label.campaign_id",
  campaign_progressive:
    "settings.integrations.externalServices.variables.label.campaign_progressive",
  campaign_client_phone:
    "settings.integrations.externalServices.variables.label.campaign_client_phone",
  campaign_company: "settings.integrations.externalServices.variables.label.campaign_company",
  campaign_strategy: "settings.integrations.externalServices.variables.label.campaign_strategy",
  campaign_selection: "settings.integrations.externalServices.variables.label.campaign_selection",
  queue_name: "settings.integrations.externalServices.variables.label.queue_name",
  acd_phase: "settings.integrations.externalServices.variables.label.acd_phase",
  acd_event: "settings.integrations.externalServices.variables.label.acd_event",
};

export const EXTERNAL_SERVICES_VARIABLE_DESCRIPTION_KEYS: Readonly<
  Record<string, TranslationKey>
> = {
  timestamp: "settings.integrations.externalServices.variables.desc.timestamp",
  event_type: "settings.integrations.externalServices.variables.desc.event_type",
  user_login: "settings.integrations.externalServices.variables.desc.user_login",
  call_id: "settings.integrations.externalServices.variables.desc.call_id",
  caller_id: "settings.integrations.externalServices.variables.desc.caller_id",
  called_id: "settings.integrations.externalServices.variables.desc.called_id",
  call_direction: "settings.integrations.externalServices.variables.desc.call_direction",
  hangup_reason: "settings.integrations.externalServices.variables.desc.hangup_reason",
  campaign_id: "settings.integrations.externalServices.variables.desc.campaign_id",
  campaign_progressive:
    "settings.integrations.externalServices.variables.desc.campaign_progressive",
  campaign_client_phone:
    "settings.integrations.externalServices.variables.desc.campaign_client_phone",
  campaign_company: "settings.integrations.externalServices.variables.desc.campaign_company",
  campaign_strategy: "settings.integrations.externalServices.variables.desc.campaign_strategy",
  campaign_selection: "settings.integrations.externalServices.variables.desc.campaign_selection",
  queue_name: "settings.integrations.externalServices.variables.desc.queue_name",
  acd_phase: "settings.integrations.externalServices.variables.desc.acd_phase",
  acd_event: "settings.integrations.externalServices.variables.desc.acd_event",
};

/** Operator-facing short explanations shown in the ? help popup. */
export const EXTERNAL_SERVICES_VARIABLE_HELP_KEYS: Readonly<Record<string, TranslationKey>> = {
  timestamp: "settings.integrations.externalServices.variables.help.timestamp",
  event_type: "settings.integrations.externalServices.variables.help.event_type",
  user_login: "settings.integrations.externalServices.variables.help.user_login",
  call_id: "settings.integrations.externalServices.variables.help.call_id",
  caller_id: "settings.integrations.externalServices.variables.help.caller_id",
  called_id: "settings.integrations.externalServices.variables.help.called_id",
  call_direction: "settings.integrations.externalServices.variables.help.call_direction",
  hangup_reason: "settings.integrations.externalServices.variables.help.hangup_reason",
  campaign_id: "settings.integrations.externalServices.variables.help.campaign_id",
  campaign_progressive:
    "settings.integrations.externalServices.variables.help.campaign_progressive",
  campaign_client_phone:
    "settings.integrations.externalServices.variables.help.campaign_client_phone",
  campaign_company: "settings.integrations.externalServices.variables.help.campaign_company",
  campaign_strategy: "settings.integrations.externalServices.variables.help.campaign_strategy",
  campaign_selection: "settings.integrations.externalServices.variables.help.campaign_selection",
  queue_name: "settings.integrations.externalServices.variables.help.queue_name",
  acd_phase: "settings.integrations.externalServices.variables.help.acd_phase",
  acd_event: "settings.integrations.externalServices.variables.help.acd_event",
};
