/**
 * - Purpose: recall and walk dialpad numbers from call history.
 * - Inputs: history remote numbers (newest first), walk index, arrow delta, dialed value.
 * - Outputs: unique number list, next walk index/number, fill-or-dial call action.
 */

export function buildDialpadHistoryNumbers(
  remoteNumbers: ReadonlyArray<string>,
): ReadonlyArray<string> {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of remoteNumbers) {
    const number = raw.trim();
    if (number.length === 0 || seen.has(number)) {
      continue;
    }
    seen.add(number);
    result.push(number);
  }
  return result;
}

export function resolveHistoryWalkStep(
  numbers: ReadonlyArray<string>,
  currentIndex: number | null,
  direction: "newer" | "older",
): Readonly<{ index: number; number: string }> | null {
  if (numbers.length === 0) {
    return null;
  }
  if (currentIndex === null) {
    return { index: 0, number: numbers[0]! };
  }
  const nextIndex =
    direction === "newer"
      ? Math.max(0, currentIndex - 1)
      : Math.min(numbers.length - 1, currentIndex + 1);
  const number = numbers[nextIndex];
  if (number === undefined) {
    return null;
  }
  return { index: nextIndex, number };
}

export type DialpadCallIntent =
  | Readonly<{ type: "fill"; number: string }>
  | Readonly<{ type: "dial"; number: string }>
  | Readonly<{ type: "noop" }>;

/**
 * - Purpose: map call-button press to fill-last or dial.
 * - Inputs: current dialed value and newest history number.
 * - Outputs: fill, dial, or noop intent.
 */
export function resolveDialpadCallIntent(
  dialedNumber: string,
  lastHistoryNumber: string | null,
): DialpadCallIntent {
  const trimmed = dialedNumber.trim();
  if (trimmed.length > 0) {
    return { type: "dial", number: trimmed };
  }
  if (lastHistoryNumber !== null && lastHistoryNumber.trim().length > 0) {
    return { type: "fill", number: lastHistoryNumber.trim() };
  }
  return { type: "noop" };
}
