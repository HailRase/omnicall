/**
 * - Purpose: detect an open `{{…` template autocomplete session at a caret.
 * - Inputs: field value and caret index (selection start).
 * - Outputs: open session with replace range and filter prefix, or null.
 */

const NAME_CHAR = /[A-Za-z0-9_]/;

export type TemplateAutocompleteSession = Readonly<{
  openIndex: number;
  replaceEnd: number;
  prefix: string;
}>;

export function detectTemplateAutocompleteSession(
  value: string,
  caretIndex: number,
): TemplateAutocompleteSession | null {
  if (caretIndex < 0 || caretIndex > value.length) {
    return null;
  }
  const beforeCaret = value.slice(0, caretIndex);
  const openIndex = beforeCaret.lastIndexOf("{{");
  if (openIndex < 0) {
    return null;
  }
  const nameStart = openIndex + 2;
  const prefix = value.slice(nameStart, caretIndex);
  if (prefix.length > 0 && !isTemplateVariableNamePrefix(prefix)) {
    return null;
  }
  let replaceEnd = caretIndex;
  while (replaceEnd < value.length && NAME_CHAR.test(value.charAt(replaceEnd))) {
    replaceEnd += 1;
  }
  if (value.startsWith("}}", replaceEnd)) {
    replaceEnd += 2;
  }
  return { openIndex, replaceEnd, prefix };
}

export function isTemplateVariableNamePrefix(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    if (!NAME_CHAR.test(value.charAt(index))) {
      return false;
    }
  }
  return true;
}

export function applyTemplateAutocompleteSelection(
  value: string,
  session: TemplateAutocompleteSession,
  variableName: string,
): Readonly<{ nextValue: string; nextCaret: number }> {
  const token = `{{${variableName}}}`;
  const nextValue =
    value.slice(0, session.openIndex) + token + value.slice(session.replaceEnd);
  return {
    nextValue,
    nextCaret: session.openIndex + token.length,
  };
}
