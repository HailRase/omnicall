/**
 * - Purpose: preset size chips for External Application window geometry.
 * - Inputs: current width/height, disabled flag, size-change callback.
 * - Outputs: presentational chip buttons updating width/height.
 */

import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { Button } from "../../ui/index.js";
import {
  matchWindowGeometryPreset,
  WINDOW_GEOMETRY_PRESETS,
} from "./windowGeometryPresets.js";
import styles from "./WindowGeometryEditor.module.css";

export type WindowGeometryPresetChipsProps = Readonly<{
  width: number;
  height: number;
  disabled: boolean;
  onSelect: (size: Readonly<{ width: number; height: number }>) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function WindowGeometryPresetChips({
  width,
  height,
  disabled,
  onSelect,
}: WindowGeometryPresetChipsProps): JSX.Element {
  const { t } = useI18n();
  const activeId = matchWindowGeometryPreset(width, height);

  return (
    <div
      className={styles.presets}
      role="group"
      aria-label={t(
        "settings.integrations.externalApplications.windowGeometry.presets.label",
      )}
      data-testid="external-applications-geometry-presets"
    >
      {WINDOW_GEOMETRY_PRESETS.map((preset) => {
        const selected = preset.id === activeId;
        return (
          <Button
            key={preset.id}
            type="button"
            size="sm"
            variant={selected ? "secondary" : "outline"}
            disabled={disabled}
            aria-pressed={selected}
            data-testid={`external-applications-geometry-preset-${preset.id}`}
            onClick={() => {
              onSelect({ width: preset.width, height: preset.height });
            }}
          >
            {t(preset.labelKey)}
          </Button>
        );
      })}
    </div>
  );
}
