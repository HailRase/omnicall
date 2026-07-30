/**
 * - Purpose: insert a completed `{{name}}` token at a caret or append as fallback.
 * - Inputs: current value, optional caret index, token string.
 * - Outputs: next value and caret after insertion.
 */

export function insertTemplateTokenAtCaret(
  value: string,
  token: string,
  caretIndex: number | null,
): Readonly<{ nextValue: string; nextCaret: number }> {
  if (caretIndex === null || caretIndex < 0 || caretIndex > value.length) {
    return {
      nextValue: `${value}${token}`,
      nextCaret: value.length + token.length,
    };
  }
  return {
    nextValue: `${value.slice(0, caretIndex)}${token}${value.slice(caretIndex)}`,
    nextCaret: caretIndex + token.length,
  };
}
