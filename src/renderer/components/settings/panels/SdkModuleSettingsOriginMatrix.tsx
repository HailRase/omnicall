import type { JSX } from "react";
import {
  withMatrixCapability,
  type SdkOriginCapabilityMatrix,
  type SdkOriginMatrixCapabilityId,
} from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import { FormField, Select } from "../../ui/index.js";
import styles from "./SdkModuleSettingsCard.module.css";
import {
  SDK_ORIGIN_MATRIX_LABEL_KEYS,
  SDK_ORIGIN_MATRIX_TECH_IDS,
  SDK_ORIGIN_MATRIX_UI_CAPABILITY_IDS,
} from "./sdkOriginMatrixUi.js";

type Props = Readonly<{
  origin: string;
  matrix: SdkOriginCapabilityMatrix;
  busy: boolean;
  onSetOriginMatrix: (origin: string, matrix: SdkOriginCapabilityMatrix) => void;
}>;

type PermissionValue = "allowed" | "denied";

/**
 * - Purpose: per-Origin permission Selects (allowed/denied) with label above each control.
 */
export function SdkModuleSettingsOriginMatrix({
  origin,
  matrix,
  busy,
  onSetOriginMatrix,
}: Props): JSX.Element {
  const { t } = useI18n();

  const permissionItems = [
    {
      value: "allowed" as const,
      label: t("settings.integrations.sdk.permission.allowed"),
    },
    {
      value: "denied" as const,
      label: t("settings.integrations.sdk.permission.denied"),
    },
  ];

  function setCapability(
    capability: SdkOriginMatrixCapabilityId,
    value: PermissionValue,
  ): void {
    onSetOriginMatrix(
      origin,
      withMatrixCapability(matrix, capability, value === "allowed"),
    );
  }

  return (
    <div
      className={styles.matrixBlock}
      data-testid={`sdk-origin-matrix-${origin}`}
    >
      <div className={styles.matrixList}>
        {SDK_ORIGIN_MATRIX_UI_CAPABILITY_IDS.map((capability) => {
          const labelKey = SDK_ORIGIN_MATRIX_LABEL_KEYS[capability];
          const selectId = `sdk-matrix-${capability}-${origin}`;
          const techId = SDK_ORIGIN_MATRIX_TECH_IDS[capability];
          const value: PermissionValue =
            matrix.capabilities[capability] === true ? "allowed" : "denied";

          return (
            <FormField
              key={capability}
              label={<span title={techId}>{t(labelKey)}</span>}
              disabled={busy}
              className={styles.permissionField}
            >
              <Select
                id={selectId}
                className={styles.permissionSelect}
                size="sm"
                items={permissionItems}
                value={value}
                disabled={busy}
                data-testid={`sdk-matrix-${capability}-${origin}`}
                onValueChange={(next) => {
                  if (next === "allowed" || next === "denied") {
                    setCapability(capability, next);
                  }
                }}
              />
            </FormField>
          );
        })}
      </div>
    </div>
  );
}
