/**
 * - Purpose: numeric X/Y inputs for External Application window origin.
 * - Inputs: current x/y, disabled flag, position-change callback.
 * - Outputs: validated FormField inputs committed on blur/Enter.
 */

import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { FormField } from "../../ui/index.js";
import {
  MAX_WINDOW_X,
  MAX_WINDOW_Y,
  MIN_WINDOW_X,
  MIN_WINDOW_Y,
} from "./windowGeometryConstants.js";
import { clampWindowX, clampWindowY } from "./windowGeometryMath.js";
import { useGeometryFieldValidation } from "./useGeometryFieldValidation.js";
import { WindowGeometryNumberField } from "./WindowGeometryNumberField.js";
import styles from "./WindowGeometryEditor.module.css";

export type WindowGeometryPositionFieldsProps = Readonly<{
  x: number;
  y: number;
  disabled: boolean;
  onChange: (next: Readonly<{ x: number; y: number }>) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function WindowGeometryPositionFields({
  x,
  y,
  disabled,
  onChange,
}: WindowGeometryPositionFieldsProps): JSX.Element {
  const { t } = useI18n();
  const xValidation = useGeometryFieldValidation(t);
  const yValidation = useGeometryFieldValidation(t);

  return (
    <div className={styles.fieldGroup}>
      <p className={styles.groupLabel}>
        {t("settings.integrations.externalApplications.windowGeometry.positionGroup")}
      </p>
      <div className={styles.positionGrid}>
        <FormField
          label={t("settings.integrations.externalApplications.windowGeometry.x")}
          hint={t(
            "settings.integrations.externalApplications.windowGeometry.validation.rangeHint",
            { min: MIN_WINDOW_X, max: MAX_WINDOW_X },
          )}
          error={xValidation.error}
        >
          <WindowGeometryNumberField
            value={x}
            min={MIN_WINDOW_X}
            max={MAX_WINDOW_X}
            disabled={disabled}
            clamp={clampWindowX}
            data-testid="external-applications-geometry-x"
            onValidationChange={xValidation.onValidationChange}
            onCommit={(nextX) => {
              onChange({ x: nextX, y });
            }}
          />
        </FormField>
        <FormField
          label={t("settings.integrations.externalApplications.windowGeometry.y")}
          hint={t(
            "settings.integrations.externalApplications.windowGeometry.validation.rangeHint",
            { min: MIN_WINDOW_Y, max: MAX_WINDOW_Y },
          )}
          error={yValidation.error}
        >
          <WindowGeometryNumberField
            value={y}
            min={MIN_WINDOW_Y}
            max={MAX_WINDOW_Y}
            disabled={disabled}
            clamp={clampWindowY}
            data-testid="external-applications-geometry-y"
            onValidationChange={yValidation.onValidationChange}
            onCommit={(nextY) => {
              onChange({ x, y: nextY });
            }}
          />
        </FormField>
      </div>
    </div>
  );
}
