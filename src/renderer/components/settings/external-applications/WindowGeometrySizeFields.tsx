/**
 * - Purpose: free pixel width/height inputs for window geometry.
 * - Inputs: current size, disabled flag, size-change callback.
 * - Outputs: validated FormField inputs committed on blur/Enter.
 */

import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { FormField } from "../../ui/index.js";
import {
  MAX_WINDOW_HEIGHT,
  MAX_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
} from "./windowGeometryConstants.js";
import {
  clampWindowHeight,
  clampWindowWidth,
} from "./windowGeometryMath.js";
import { useGeometryFieldValidation } from "./useGeometryFieldValidation.js";
import { WindowGeometryNumberField } from "./WindowGeometryNumberField.js";
import styles from "./WindowGeometryEditor.module.css";

export type WindowGeometrySizeFieldsProps = Readonly<{
  width: number;
  height: number;
  disabled: boolean;
  onChange: (size: Readonly<{ width: number; height: number }>) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function WindowGeometrySizeFields({
  width,
  height,
  disabled,
  onChange,
}: WindowGeometrySizeFieldsProps): JSX.Element {
  const { t } = useI18n();
  const widthValidation = useGeometryFieldValidation(t);
  const heightValidation = useGeometryFieldValidation(t);

  return (
    <div className={styles.fieldGroup}>
      <p className={styles.groupLabel}>
        {t("settings.integrations.externalApplications.windowGeometry.sizeGroup")}
      </p>
      <div className={styles.sizeGrid}>
        <FormField
          label={t("settings.integrations.externalApplications.window.width")}
          hint={t(
            "settings.integrations.externalApplications.windowGeometry.validation.rangeHint",
            { min: MIN_WINDOW_WIDTH, max: MAX_WINDOW_WIDTH },
          )}
          error={widthValidation.error}
        >
          <WindowGeometryNumberField
            value={width}
            min={MIN_WINDOW_WIDTH}
            max={MAX_WINDOW_WIDTH}
            disabled={disabled}
            clamp={clampWindowWidth}
            data-testid="external-applications-geometry-width"
            onValidationChange={widthValidation.onValidationChange}
            onCommit={(nextWidth) => {
              onChange({ width: nextWidth, height });
            }}
          />
        </FormField>
        <FormField
          label={t("settings.integrations.externalApplications.window.height")}
          hint={t(
            "settings.integrations.externalApplications.windowGeometry.validation.rangeHint",
            { min: MIN_WINDOW_HEIGHT, max: MAX_WINDOW_HEIGHT },
          )}
          error={heightValidation.error}
        >
          <WindowGeometryNumberField
            value={height}
            min={MIN_WINDOW_HEIGHT}
            max={MAX_WINDOW_HEIGHT}
            disabled={disabled}
            clamp={clampWindowHeight}
            data-testid="external-applications-geometry-height"
            onValidationChange={heightValidation.onValidationChange}
            onCommit={(nextHeight) => {
              onChange({ width, height: nextHeight });
            }}
          />
        </FormField>
      </div>
    </div>
  );
}
