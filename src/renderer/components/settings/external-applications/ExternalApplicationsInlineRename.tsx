/**
 * - Purpose: click-to-edit application name with blur commit.
 * - Inputs: current name, disabled flag, optional forced edit, a11y label, commit callback.
 * - Outputs: text button or sized input; commits trimmed non-empty name on blur.
 */

import { useEffect, useRef, useState, type JSX, type KeyboardEvent } from "react";
import styles from "./ExternalApplications.module.css";

export type ExternalApplicationsInlineRenameProps = Readonly<{
  value: string;
  disabled: boolean;
  ariaLabel: string;
  testId: string;
  forceEditKey: number;
  onCommit: (next: string) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function ExternalApplicationsInlineRename({
  value,
  disabled,
  ariaLabel,
  testId,
  forceEditKey,
  onCommit,
}: ExternalApplicationsInlineRenameProps): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastForceKey = useRef(forceEditKey);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [editing, value]);

  useEffect(() => {
    if (forceEditKey === lastForceKey.current) {
      return;
    }
    lastForceKey.current = forceEditKey;
    if (forceEditKey > 0) {
      setEditing(true);
    }
  }, [forceEditKey]);

  useEffect(() => {
    if (!editing) {
      return;
    }
    const input = inputRef.current;
    if (input === null) {
      return;
    }
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
