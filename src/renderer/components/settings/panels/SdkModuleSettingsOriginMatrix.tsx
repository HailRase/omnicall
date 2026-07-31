import clsx from "clsx";
import type { JSX } from "react";
import {
  withMatrixCapability,
  type SdkOriginCapabilityMatrix,
  type SdkOriginMatrixCapabilityId,
} from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import { AppIcon } from "../../icons/index.js";
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
 * - Purpose: per-Origin permission rows with green check / red cross status chips.
 */
export function SdkModuleSettingsOriginMatrix({
  origin,
  matrix,
  busy,
  onSetOriginMatrix,
}: Props): JSX.Element {
  const { t } = useI18n();

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
      <div className={styles.matrixList} role="list">
        {SDK_ORIGIN_MATRIX_UI_CAPABILITY_IDS.map((capability) => {
          const labelKey = SDK_ORIGIN_MATRIX_LABEL_KEYS[capability];
          const techId = SDK_ORIGIN_MATRIX_TECH_IDS[capability];
          const capabilityLabel = t(labelKey);
          const value: PermissionValue =
            matrix.capabilities[capability] === true ? "allowed" : "denied";
          const isAllowed = value === "allowed";
          const stateLabel = isAllowed
            ? t("settings.integrations.sdk.permission.allowed")
            : t("settings.integrations.sdk.permission.denied");
          const nextValue: PermissionValue = isAllowed ? "denied" : "allowed";

          return (
            <div
              key={capability}
              className={styles.permissionRow}
              role="listitem"
            >
              <span className={styles.permissionLabel} title={techId}>
                {capabilityLabel}
              </span>
              <button
                type="button"
                className={clsx(
                  styles.permissionToggle,
                  isAllowed
                    ? styles.permissionToggleAllowed
                    : styles.permissionToggleDenied,
                )}
                disabled={busy}
                aria-pressed={isAllowed}
                aria-label={`${capabilityLabel}: ${stateLabel}`}
                title={stateLabel}
                data-testid={`sdk-matrix-${capability}-${origin}`}
                onClick={() => {
                  setCapability(capability, nextValue);
                }}
              >
                <AppIcon
                  id={
                    isAllowed ? "sdk.permission.allowed" : "sdk.permission.denied"
                  }
                  decorative
                  preferAnimated={false}
                  size={16}
                />
                <span className={styles.permissionToggleLabel}>{stateLabel}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
