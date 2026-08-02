/**
 * - Purpose: accessible listbox popup for External Services template variables.
 * - Inputs: open state, suggestions, active index, floating styles, select callback.
 * - Outputs: presentational listbox options without field mutation logic.
 */

import clsx from "clsx";
import { type CSSProperties, type JSX, type Ref } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../../../i18n/index.js";
import type { TemplateAutocompleteSuggestion } from "./buildTemplateAutocompleteSuggestions.js";
import { TEMPLATE_AUTOCOMPLETE_AVAILABILITY_KEYS } from "./templateAutocompleteAvailabilityI18n.js";
import styles from "../ExternalServices.module.css";

export type TemplateAutocompletePopupProps = Readonly<{
  listboxId: string;
  open: boolean;
  suggestions: ReadonlyArray<TemplateAutocompleteSuggestion>;
  activeIndex: number;
  floatingRef: Ref<HTMLDivElement>;
  floatingStyles: CSSProperties;
  onActiveIndexChange: (index: number) => void;
  onSelectIndex: (index: number) => void;
}>;

/**
 * @uiMeta f=F-031
 */
export function TemplateAutocompletePopup({
  listboxId,
  open,
  suggestions,
  activeIndex,
  floatingRef,
  floatingStyles,
  onActiveIndexChange,
  onSelectIndex,
}: TemplateAutocompletePopupProps): JSX.Element | null {
  const { t } = useI18n();
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={floatingRef}
      id={listboxId}
      role="listbox"
      className={styles.templateAutocompletePopup}
      style={floatingStyles}
      data-testid="external-services-template-autocomplete"
      aria-label={t("settings.integrations.externalServices.variables.autocompleteLabel")}
    >
      {suggestions.map((suggestion, index) => {
        const optionId = `${listboxId}-option-${suggestion.name}`;
        const active = index === activeIndex;
        const kindLabel =
          suggestion.kind === "system"
            ? t("settings.integrations.externalServices.variables.autocompleteKind.system")
            : t("settings.integrations.externalServices.variables.autocompleteKind.collection");
        const whenLabel = t(TEMPLATE_AUTOCOMPLETE_AVAILABILITY_KEYS[suggestion.availability]);
        return (
          <div
            id={optionId}
            key={`${suggestion.kind}-${suggestion.name}`}
            role="option"
            aria-selected={active}
            className={clsx(
              styles.templateAutocompleteOption,
              active && styles.templateAutocompleteOptionActive,
            )}
            data-testid={`external-services-template-autocomplete-option-${suggestion.name}`}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelectIndex(index);
            }}
            onMouseEnter={() => onActiveIndexChange(index)}
          >
            <code className={styles.templateAutocompleteToken}>{`{{${suggestion.name}}}`}</code>
            <span className={styles.templateAutocompleteMeta}>
              <span className={styles.templateAutocompleteKind}>{kindLabel}</span>
              <span className={styles.templateAutocompleteMetaSep} aria-hidden="true">
                ·
              </span>
              <span className={styles.templateAutocompleteWhen}>{whenLabel}</span>
            </span>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
