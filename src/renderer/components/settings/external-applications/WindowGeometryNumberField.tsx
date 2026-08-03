/**
 * - Purpose: deferred numeric geometry field with range validation.
 * - Inputs: committed value, min/max, clamp, label/hint via FormField parent.
 * - Outputs: text input; commits clamped integers; reports validation errors.
 */

import {
  useEffect,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
} from "react";
import { Input } from "../../ui/index.js";

export type GeometryNumberValidation =
  | Readonly<{ kind: "ok" }>
  | Readonly<{ kind: "invalid_number" }>
  | Readonly<{ kind: "out_of_range"; min: number; max: number }>;

export type WindowGeometryNumberFieldProps = Readonly<{
  value: number;
  disabled: boolean;
  min: number;
  max: number;
  clamp: (value: number) => number;
  onCommit: (value: number) => void;
  onValidationChange?: (result: GeometryNumberValidation) => void;
  "data-testid"?: string;
  "aria-label"?: string;
}>;

function isDraftNumber(draft: string): boolean {
  const trimmed = draft.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "+") {
    return false;
  }
  return /^-?\d+$/.test(trimmed);
}

/**
 * @uiMeta f=F-032
 */
export function WindowGeometryNumberField({
  value,
  disabled,
  min,
  max,
  clamp,
  onCommit,
  onValidationChange,
  "data-testid": testId,
  "aria-label": ariaLabel,
}: WindowGeometryNumberFieldProps): JSX.Element {
  const [draft, setDraft] = useState(() => String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(String(value));
    }
  }, [value]);

  function report(result: GeometryNumberValidation): void {
    onValidationChange?.(result);
  }

  function commit(): void {
    if (!isDraftNumber(draft)) {
      setDraft(String(value));
      report({ kind: "invalid_number" });
      return;
    }
    const parsed = Number(draft.trim());
    const next = clamp(parsed);
    setDraft(String(next));
    if (parsed < min || parsed > max) {
      report({ kind: "out_of_range", min, max });
    } else {
      report({ kind: "ok" });
    }
    if (next !== value) {
      onCommit(next);
    }
  }

  function onFocus(): void {
    focusedRef.current = true;
    report({ kind: "ok" });
  }

  function onBlur(): void {
    focusedRef.current = false;
    commit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setDraft(String(value));
      report({ kind: "ok" });
      event.currentTarget.blur();
    }
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      value={draft}
      disabled={disabled}
      data-testid={testId}
      aria-label={ariaLabel}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onChange={(event) => {
        const nextDraft = event.currentTarget.value;
        if (nextDraft !== "" && !/^-?\d*$/.test(nextDraft)) {
          return;
        }
        setDraft(nextDraft);
      }}
    />
  );
}
