/**
 * - Purpose: build immutable External Services fixtures for application tests.
 * - Inputs: optional request overrides for focused scenarios.
 * - Outputs: validated settings aggregates and branded profile keys.
 */

import {
  createSettingsAccountKey,
  parseExternalServicesSettings,
  type ExternalServicesSettings,
  type SettingsAccountKey,
} from "@domain/index.js";

export const EXTERNAL_SERVICES_TEST_PROFILE_KEY = createSettingsAccountKey(
  "external-services-test-profile",
);

export const EXTERNAL_SERVICES_TEST_COLLECTION_ID =
  "a0b1c2d3-e4f5-4a67-8b90-123456789012" as const;
export const EXTERNAL_SERVICES_TEST_REQUEST_ID =
  "b0b1c2d3-e4f5-4a67-8b90-123456789012" as const;
export const EXTERNAL_SERVICES_TEST_ROW_ID =
  "c0b1c2d3-e4f5-4a67-8b90-123456789012" as const;

export function createExternalServicesTestSettings(
  overrides: Readonly<{
    collectionEnabled?: boolean;
    requestEnabled?: boolean;
    method?: string;
    url?: string;
    headers?: ReadonlyArray<Readonly<{
      id: string;
      key: string;
      value: string;
      enabled: boolean;
    }>>;
    body?: Readonly<{ mode: string; value: string }>;
    triggers?: ReadonlyArray<string>;
  }> = {},
): ExternalServicesSettings {
  const parsed = parseExternalServicesSettings({
    collections: [
      {
        id: EXTERNAL_SERVICES_TEST_COLLECTION_ID,
        name: "CRM",
        enabled: overrides.collectionEnabled ?? true,
        variables: [{ key: "base_url", value: "https://crm.example.test" }],
        requests: [
          {
            id: EXTERNAL_SERVICES_TEST_REQUEST_ID,
            name: "Notify",
            enabled: overrides.requestEnabled ?? true,
            method: overrides.method ?? "POST",
            url: overrides.url ?? "{{base_url}}/events",
            query: [],
            headers: overrides.headers ?? [
              {
                id: EXTERNAL_SERVICES_TEST_ROW_ID,
                key: "Authorization",
                value: "Bearer secret-token",
                enabled: true,
              },
            ],
            body: overrides.body ?? {
              mode: "json",
              value: "{\"event\":\"{{event_type}}\"}",
            },
            triggers: overrides.triggers ?? ["call_answered"],
          },
        ],
      },
    ],
  });
  if (!parsed.ok) {
    throw new Error("Failed to build External Services test settings.");
  }
  return parsed.value;
}

export function createExternalServicesProfileKey(
  value: string,
): SettingsAccountKey {
  return createSettingsAccountKey(value);
}
