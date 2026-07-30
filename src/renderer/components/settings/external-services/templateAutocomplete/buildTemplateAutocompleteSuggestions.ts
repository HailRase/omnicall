/**
 * - Purpose: build and filter External Services template autocomplete suggestions.
 * - Inputs: system catalog names, collection variable keys, open-session prefix.
 * - Outputs: ordered unique suggestions with source kind for popup grouping.
 */

import { EXTERNAL_SERVICE_SYSTEM_VARIABLE_NAMES } from "@application/index.js";

export type TemplateAutocompleteSuggestionKind = "system" | "collection";

export type TemplateAutocompleteSuggestion = Readonly<{
  name: string;
  kind: TemplateAutocompleteSuggestionKind;
}>;

export function buildTemplateAutocompleteSuggestions(
  collectionVariableKeys: ReadonlyArray<string>,
): ReadonlyArray<TemplateAutocompleteSuggestion> {
  const system = EXTERNAL_SERVICE_SYSTEM_VARIABLE_NAMES.map(
    (name): TemplateAutocompleteSuggestion => ({ name, kind: "system" }),
  );
  const seen = new Set<string>(EXTERNAL_SERVICE_SYSTEM_VARIABLE_NAMES);
  const collection: TemplateAutocompleteSuggestion[] = [];
  for (const key of collectionVariableKeys) {
    const trimmed = key.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    collection.push({ name: trimmed, kind: "collection" });
  }
  return [...system, ...collection];
}

export function filterTemplateAutocompleteSuggestions(
  suggestions: ReadonlyArray<TemplateAutocompleteSuggestion>,
  prefix: string,
): ReadonlyArray<TemplateAutocompleteSuggestion> {
  if (prefix.length === 0) {
    return suggestions;
  }
  return suggestions.filter((item) => item.name.startsWith(prefix));
}
