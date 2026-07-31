/**
 * - Purpose: normalize and validate authored collection template variables.
 * - Inputs: raw key/value rows from editor or import mutation.
 * - Outputs: frozen unique variables or structured validation failure.
 */

import type { ExternalServiceVariable } from "../ExternalServicesSettings.js";
import { isExternalServiceSystemVariableName } from "./ExternalServiceVariableCatalog.js";

export type ExternalServiceCollectionVariablesNormalizeError =
  | "duplicate_variable_key"
  | "empty_variable_key";

export type NormalizeExternalServiceCollectionVariablesResult =
  | Readonly<{ ok: true; variables: ReadonlyArray<ExternalServiceVariable> }>
  | Readonly<{ ok: false; error: ExternalServiceCollectionVariablesNormalizeError }>;

export type ExternalServiceCollectionVariableRowIssue =
  | "empty_key"
  | "duplicate_key"
  | "system_name";

export type ExternalServiceCollectionVariableRowInspection = Readonly<{
  index: number;
  issues: ReadonlyArray<ExternalServiceCollectionVariableRowIssue>;
}>;

export function normalizeExternalServiceCollectionVariables(
  variables: ReadonlyArray<Readonly<{ key: string; value: string }>>,
): NormalizeExternalServiceCollectionVariablesResult {
  const next: ExternalServiceVariable[] = [];
  const seen = new Set<string>();

  for (const variable of variables) {
    const key = variable.key.trim();
    if (key.length === 0) {
      if (variable.value.length > 0) {
        return { ok: false, error: "empty_variable_key" };
      }
      continue;
    }
    if (seen.has(key)) {
      return { ok: false, error: "duplicate_variable_key" };
    }
    seen.add(key);
    next.push(Object.freeze({ key, value: variable.value }));
  }

  return { ok: true, variables: Object.freeze(next) };
}

export function inspectExternalServiceCollectionVariableRows(
  variables: ReadonlyArray<Readonly<{ key: string; value: string }>>,
): ReadonlyArray<ExternalServiceCollectionVariableRowInspection> {
  const trimmedKeys = variables.map((variable) => variable.key.trim());
  const counts = new Map<string, number>();
  for (const key of trimmedKeys) {
    if (key.length === 0) {
      continue;
    }
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const inspections: ExternalServiceCollectionVariableRowInspection[] = [];
  for (let index = 0; index < variables.length; index += 1) {
    const variable = variables[index]!;
    const key = trimmedKeys[index]!;
    const issues: ExternalServiceCollectionVariableRowIssue[] = [];
    if (key.length === 0 && variable.value.length > 0) {
      issues.push("empty_key");
    }
    if (key.length > 0 && (counts.get(key) ?? 0) > 1) {
      issues.push("duplicate_key");
    }
    if (key.length > 0 && isExternalServiceSystemVariableName(key)) {
      issues.push("system_name");
    }
    if (issues.length > 0) {
      inspections.push(Object.freeze({ index, issues: Object.freeze(issues) }));
    }
  }
  return Object.freeze(inspections);
}

export function hasBlockingExternalServiceCollectionVariableIssues(
  inspections: ReadonlyArray<ExternalServiceCollectionVariableRowInspection>,
): boolean {
  return inspections.some((inspection) =>
    inspection.issues.some((issue) => issue === "empty_key" || issue === "duplicate_key"),
  );
}
