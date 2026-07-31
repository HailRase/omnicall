/**
 * - Purpose: controlled-field autocomplete state for External Services `{{` tokens.
 * - Inputs: value, suggestions, change callback, optional disabled flag.
 * - Outputs: open session UI state, keyboard handlers, and caret-safe apply helpers.
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  type SetStateAction,
} from "react";
import {
  filterTemplateAutocompleteSuggestions,
  type TemplateAutocompleteSuggestion,
} from "./buildTemplateAutocompleteSuggestions.js";
import {
  applyTemplateAutocompleteSelection,
  detectTemplateAutocompleteSession,
  type TemplateAutocompleteSession,
} from "./detectTemplateAutocompleteSession.js";

export type TemplateAutocompleteFieldElement = HTMLInputElement | HTMLTextAreaElement;

export type UseTemplateAutocompleteFieldArgs = Readonly<{
  value: string;
  suggestions: ReadonlyArray<TemplateAutocompleteSuggestion>;
  disabled: boolean;
  onValueChange: (value: string) => void;
  inputRef: RefObject<TemplateAutocompleteFieldElement | null>;
}>;

export type UseTemplateAutocompleteFieldResult = Readonly<{
  listboxId: string;
  open: boolean;
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  visibleSuggestions: ReadonlyArray<TemplateAutocompleteSuggestion>;
  activeOptionId: string | undefined;
  syncFromValue: (nextValue: string, caretIndex: number) => void;
  close: () => void;
  selectIndex: (index: number) => void;
  onKeyDown: (event: ReactKeyboardEvent<TemplateAutocompleteFieldElement>) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (nextValue: string, caretIndex: number) => void;
}>;

export function useTemplateAutocompleteField(
  args: UseTemplateAutocompleteFieldArgs,
): UseTemplateAutocompleteFieldResult {
  const { value, suggestions, disabled, onValueChange, inputRef } = args;
  const listboxId = useId();
  const composingRef = useRef(false);
  const pendingCaretRef = useRef<number | null>(null);
  const sessionRef = useRef<TemplateAutocompleteSession | null>(null);
  const [session, setSession] = useState<TemplateAutocompleteSession | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const visibleSuggestions = useMemo(
    () =>
      session === null
        ? []
        : filterTemplateAutocompleteSuggestions(suggestions, session.prefix),
    [session, suggestions],
  );
  const open = !disabled && session !== null && visibleSuggestions.length > 0;

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    setActiveIndex(0);
  }, [session?.openIndex, session?.prefix]);

  useEffect(() => {
    if (visibleSuggestions.length === 0 || activeIndex < visibleSuggestions.length) {
      return;
    }
    setActiveIndex(visibleSuggestions.length - 1);
  }, [activeIndex, visibleSuggestions.length]);

  useLayoutEffect(() => {
    const caret = pendingCaretRef.current;
    const element = inputRef.current;
    if (caret === null || element === null) {
      return;
    }
    element.setSelectionRange(caret, caret);
    pendingCaretRef.current = null;
  }, [value, inputRef]);

  const close = useCallback((): void => {
    setSession(null);
    sessionRef.current = null;
  }, []);

  const syncFromValue = useCallback(
    (nextValue: string, caretIndex: number): void => {
      if (disabled || composingRef.current) {
        close();
        return;
      }
      const next = detectTemplateAutocompleteSession(nextValue, caretIndex);
      setSession(next);
      sessionRef.current = next;
    },
    [close, disabled],
  );

  const selectIndex = useCallback(
    (index: number): void => {
      const current = sessionRef.current;
      const suggestion = visibleSuggestions[index];
      if (current === null || suggestion === undefined) {
        return;
      }
      const applied = applyTemplateAutocompleteSelection(value, current, suggestion.name);
      pendingCaretRef.current = applied.nextCaret;
      onValueChange(applied.nextValue);
      close();
    },
    [close, onValueChange, value, visibleSuggestions],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<TemplateAutocompleteFieldElement>): void => {
      if (!open) {
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % visibleSuggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) =>
          index === 0 ? visibleSuggestions.length - 1 : index - 1,
        );
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        selectIndex(activeIndex);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    },
    [activeIndex, close, open, selectIndex, visibleSuggestions.length],
  );

  const onCompositionStart = useCallback((): void => {
    composingRef.current = true;
    close();
  }, [close]);

  const onCompositionEnd = useCallback(
    (nextValue: string, caretIndex: number): void => {
      composingRef.current = false;
      syncFromValue(nextValue, caretIndex);
    },
    [syncFromValue],
  );

  const activeSuggestion = visibleSuggestions[activeIndex];
  const activeOptionId =
    open && activeSuggestion !== undefined
      ? `${listboxId}-option-${activeSuggestion.name}`
      : undefined;

  return {
    listboxId,
    open,
    activeIndex,
    setActiveIndex,
    visibleSuggestions,
    activeOptionId,
    syncFromValue,
    close,
    selectIndex,
    onKeyDown,
    onCompositionStart,
    onCompositionEnd,
  };
}
