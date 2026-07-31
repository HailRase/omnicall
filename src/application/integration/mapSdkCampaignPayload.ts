/**
 * Build redacted public campaign DTO (ADR-0019). Never includes OCP wire ids.
 */

import { OpaqueIdSchema, type WireJsonObject } from "@softomnitel/omnicall-protocol";

import { redactPhoneForSdk } from "./sdkPrivacyRedaction.js";

export type SdkCampaignSource = Readonly<{
  campaignId: string;
  progressive: boolean;
  clientPhone: string;
  companyTitle: string;
  strategyTitle: string;
  selectionTitle: string;
  queueTitle: string;
}>;

/**
 * Returns null when campaignId is not a valid public opaque id.
 */
export function mapSdkCampaignOfferedPayload(
  source: SdkCampaignSource,
): WireJsonObject | null {
  const campaignIdParsed = OpaqueIdSchema.safeParse(source.campaignId.trim());
  if (!campaignIdParsed.success) {
    return null;
  }
  const remoteNumber = redactOptionalPhone(source.clientPhone);
  return {
    campaignId: campaignIdParsed.data,
    mode: source.progressive ? "progressive" : "preview",
    ...(remoteNumber !== undefined ? { remoteNumber } : {}),
    ...optionalLabel("companyLabel", source.companyTitle),
    ...optionalLabel("strategyLabel", source.strategyTitle),
    ...optionalLabel("selectionLabel", source.selectionTitle),
    ...optionalLabel("queueLabel", source.queueTitle),
  };
}

function redactOptionalPhone(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return redactPhoneForSdk(trimmed);
}

function optionalLabel(
  key: string,
  raw: string,
): WireJsonObject {
  const trimmed = raw.trim().slice(0, 128);
  if (trimmed.length === 0) {
    return {};
  }
  return { [key]: trimmed };
}
