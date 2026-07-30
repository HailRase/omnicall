import { useEffect, useRef, useState, type JSX, type KeyboardEvent } from "react";
import styles from "./ExternalServices.module.css";

export type ExternalServicesInlineRenameProps = Readonly<{
  value: string;
  disabled: boolean;
  ariaLabel: string;
  testId: string;
  onCommit: (next: string) => void;
}>;

/**
 * - Purpose: click-to-edit breadcrumb name with blur commit.
 * - Inputs: current name, disabled flag, a11y label, commit callback.
 * - Outputs: text button or sized input; commits trimmed non-empty name on blur.
 * @uiMeta f=F-031
 */
export function ExternalServicesInlineRename({
  value,
  disabled,
  ariaLabel,
  testId,
  onCommit,
}: ExternalServicesInlineRenameProps): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [editing, value]);

  useEffect(() => {
    if (!editing) return;
    const input = inputRef.current;
    if (input === null) return;
    input.focus();
    input.select();
  }, [editing]);

  if (!editing) {
    return (
      <button
        type="button"
        className={styles.inlineRenameText}
        disabled={disabled}
        aria-label={ariaLabel}
        data-testid={testId}
        onClick={() => {
          setEditing(true);
        }}
      >
        {value}
      </button>
    );
  }

  const commit = (): void => {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed.length === 0 || trimmed === value) {
      setDraft(value);
      return;
    }
    onCommit(trimmed);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft(value);
      setEditing(false);
    }
  };

  return (
    <input
      ref={inputRef}
      className={styles.inlineRenameInput}
      value={draft}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={testId}
      size={Math.max(draft.length, 4)}
      onChange={(event) => {
        setDraft(event.currentTarget.value);
      }}
      onBlur={commit}
      onKeyDown={onKeyDown}
    />
  );
}
