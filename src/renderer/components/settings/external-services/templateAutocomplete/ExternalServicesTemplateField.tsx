/**
 * - Purpose: Input/Textarea wrapper with `{{` template variable autocomplete.
 * - Inputs: value, collection variable keys, disabled, field variant, change intents.
 * - Outputs: presentational field intents with caret-safe token completion.
 */

import { autoUpdate, flip, offset, shift } from "@floating-ui/dom";
import { useFloating } from "@floating-ui/react-dom";
import {
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type CompositionEvent,
  type JSX,
  type SyntheticEvent,
} from "react";
import { Input } from "../../../ui/input/Input.js";
import { Textarea } from "../../../ui/textarea/Textarea.js";
import type { ControlSize } from "../../../ui/types.js";
import { buildTemplateAutocompleteSuggestions } from "./buildTemplateAutocompleteSuggestions.js";
import { TemplateAutocompletePopup } from "./TemplateAutocompletePopup.js";
import {
  useTemplateAutocompleteField,
  type TemplateAutocompleteFieldElement,
} from "./useTemplateAutocompleteField.js";
import styles from "../ExternalServices.module.css";

export type ExternalServicesTemplateFieldProps = Readonly<{
  value: string;
  disabled: boolean;
  collectionVariableKeys: ReadonlyArray<string>;
  variant: "input" | "textarea";
  size?: ControlSize;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  "data-testid"?: string;
  onValueChange: (value: string) => void;
  onFocus?: () => void;
  onCaretChange?: (caretIndex: number) => void;
}>;

function readCaret(element: TemplateAutocompleteFieldElement): number {
  return element.selectionStart ?? element.value.length;
}

/**
 * @uiMeta f=F-031
 */
export function ExternalServicesTemplateField(
  props: ExternalServicesTemplateFieldProps,
): JSX.Element {
  const {
    value,
    disabled,
    collectionVariableKeys,
    variant,
    size = "md",
    className,
    placeholder,
    onValueChange,
    onFocus,
    onCaretChange,
  } = props;
  const inputRef = useRef<TemplateAutocompleteFieldElement | null>(null);
  const suggestions = useMemo(
    () => buildTemplateAutocompleteSuggestions(collectionVariableKeys),
    [collectionVariableKeys],
  );
  const autocomplete = useTemplateAutocompleteField({
    value,
    suggestions,
    disabled,
    onValueChange,
    inputRef,
  });
  const { refs, floatingStyles, update } = useFloating({
    placement: "bottom-start",
    open: autocomplete.open,
    middleware: [
      offset(4),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 8 }),
    ],
  });

  useEffect(() => {
    if (!autocomplete.open) {
      return;
    }
    void update();
    const reference = refs.reference.current;
    const floating = refs.floating.current;
    if (reference === null || floating === null) {
      return;
    }
    return autoUpdate(reference, floating, update);
  }, [autocomplete.open, refs.floating, refs.reference, update]);

  const bindRef = (element: TemplateAutocompleteFieldElement | null): void => {
    inputRef.current = element;
    refs.setReference(element);
  };

  const reportCaret = (element: TemplateAutocompleteFieldElement): number => {
    const caret = readCaret(element);
    onCaretChange?.(caret);
    return caret;
  };

  const handleChange = (event: ChangeEvent<TemplateAutocompleteFieldElement>): void => {
    const element = event.currentTarget;
    onValueChange(element.value);
    autocomplete.syncFromValue(element.value, reportCaret(element));
  };

  const handleSelect = (event: SyntheticEvent<TemplateAutocompleteFieldElement>): void => {
    autocomplete.syncFromValue(event.currentTarget.value, reportCaret(event.currentTarget));
  };

  const handleCompositionEnd = (
    event: CompositionEvent<TemplateAutocompleteFieldElement>,
  ): void => {
    const element = event.currentTarget;
    autocomplete.onCompositionEnd(element.value, readCaret(element));
  };

  const sharedProps = {
    ref: bindRef,
    value,
    disabled,
    size,
    role: "combobox" as const,
    "aria-expanded": autocomplete.open,
    "aria-controls": autocomplete.listboxId,
    "aria-autocomplete": "list" as const,
    ...(autocomplete.activeOptionId !== undefined
      ? { "aria-activedescendant": autocomplete.activeOptionId }
      : {}),
    ...(className !== undefined ? { className } : {}),
    ...(placeholder !== undefined ? { placeholder } : {}),
    ...(props["aria-label"] !== undefined ? { "aria-label": props["aria-label"] } : {}),
    ...(props["data-testid"] !== undefined ? { "data-testid": props["data-testid"] } : {}),
    onFocus: () => {
      onFocus?.();
      const element = inputRef.current;
      if (element !== null) {
        autocomplete.syncFromValue(element.value, reportCaret(element));
      }
    },
    onBlur: () => {
      window.setTimeout(() => autocomplete.close(), 0);
    },
    onChange: handleChange,
    onSelect: handleSelect,
    onKeyDown: autocomplete.onKeyDown,
    onCompositionStart: autocomplete.onCompositionStart,
    onCompositionEnd: handleCompositionEnd,
  };

  return (
    <div className={styles.templateAutocompleteHost}>
      {variant === "textarea" ? <Textarea {...sharedProps} /> : <Input {...sharedProps} />}
      <TemplateAutocompletePopup
        listboxId={autocomplete.listboxId}
        open={autocomplete.open}
        suggestions={autocomplete.visibleSuggestions}
        activeIndex={autocomplete.activeIndex}
        floatingRef={refs.setFloating}
        floatingStyles={floatingStyles}
        onActiveIndexChange={autocomplete.setActiveIndex}
        onSelectIndex={autocomplete.selectIndex}
      />
    </div>
  );
}
