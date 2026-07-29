/**
 * - Purpose: resolve authored External Services template tokens deterministically.
 * - Inputs: source text and a case-sensitive variable dictionary.
 * - Outputs: text with all non-nested placeholders substituted.
 */
export type ExternalServiceVariables = Readonly<Record<string, string>>;

const TEMPLATE_TOKEN = /\{\{([^{}]*)\}\}/g;

export function resolveExternalServiceTemplate(
  source: string,
  variables: ExternalServiceVariables,
): string {
  return source.replace(TEMPLATE_TOKEN, (_token, rawName: string) => {
    const name = rawName.trim();
    return variables[name] ?? "undefined";
  });
}
