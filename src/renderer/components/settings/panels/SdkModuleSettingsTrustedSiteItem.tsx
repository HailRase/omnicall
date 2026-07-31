import type { JSX } from "react";
import { useState } from "react";
import type { SdkOriginCapabilityMatrix, SdkOriginTrustEntry } from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";
import {
  SdkModuleSettingsOriginConfirmDialog,
  type OriginConfirmKind,
} from "./SdkModuleSettingsOriginConfirmDialog.js";
import { SdkModuleSettingsOriginAddressEditor } from "./SdkModuleSettingsOriginAddressEditor.js";
import { SdkModuleSettingsOriginMatrix } from "./SdkModuleSettingsOriginMatrix.js";
import { SDK_ORIGIN_MATRIX_UI_CAPABILITY_IDS } from "./sdkOriginMatrixUi.js";

type Props = Readonly<{
  entry: SdkOriginTrustEntry;
  busy: boolean;
  onBlacklistOrigin: (origin: string) => void;
  onRemoveAllowedOrigin: (origin: string) => void;
  onRenameAllowedOrigin: (previousOrigin: string, nextOrigin: string) => void;
  onSetOriginMatrix: (origin: string, matrix: SdkOriginCapabilityMatrix) => void;
}>;

function countEnabled(matrix: SdkOriginCapabilityMatrix | null): number {
  if (matrix === null) {
    return 0;
  }
  let count = 0;
  for (const capability of SDK_ORIGIN_MATRIX_UI_CAPABILITY_IDS) {
    if (matrix.capabilities[capability] === true) {
      count += 1;
    }
  }
  return count;
}

/**
 * - Purpose: one trusted site as Accordion item — address edit, permissions, CRUD.
 */
export function SdkModuleSettingsTrustedSiteItem({
  entry,
  busy,
  onBlacklistOrigin,
  onRemoveAllowedOrigin,
  onRenameAllowedOrigin,
  onSetOriginMatrix,
}: Props): JSX.Element {
  const { t } = useI18n();
  const [confirmKind, setConfirmKind] = useState<OriginConfirmKind | null>(null);
  const enabledCount = countEnabled(entry.matrix);

  function confirmDestructive(): void {
    if (confirmKind === "remove") {
      onRemoveAllowedOrigin(entry.origin);
    } else if (confirmKind === "blacklist") {
      onBlacklistOrigin(entry.origin);
    }
    setConfirmKind(null);
  }

  return (
    <AccordionItem
      value={entry.origin}
      data-testid={`sdk-allowed-origin-${entry.origin}`}
    >
      <AccordionTrigger className={styles.accordionTrigger}>
        <span className={styles.accordionTriggerText}>
          <span className={styles.listTitle} title={entry.origin}>
            {entry.origin}
          </span>
          <span className={styles.listSubtitle}>
            {t("settings.integrations.sdk.matrix.summary", { count: enabledCount })}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className={styles.accordionBody}>
          <div className={styles.accordionSection}>
            <SdkModuleSettingsOriginAddressEditor
              origin={entry.origin}
              busy={busy}
              onRenameAllowedOrigin={onRenameAllowedOrigin}
            />
          </div>

          {entry.matrix !== null ? (
            <>
              <hr className={styles.accordionSectionDivider} />
              <div className={styles.accordionSection}>
                <p className={styles.accordionSectionTitle}>
                  {t("settings.integrations.sdk.matrix.title")}
                </p>
                <SdkModuleSettingsOriginMatrix
                  origin={entry.origin}
                  matrix={entry.matrix}
                  busy={busy}
                  onSetOriginMatrix={onSetOriginMatrix}
                />
              </div>
            </>
          ) : null}

          <hr className={styles.accordionSectionDivider} />
          <div className={styles.accordionSection}>
            <div className={formStyles.stackedFormActions}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                data-testid={`sdk-origin-blacklist-${entry.origin}`}
                onClick={() => {
                  setConfirmKind("blacklist");
                }}
              >
                {t("settings.integrations.sdk.blacklist.quick")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={busy}
                data-testid={`sdk-origin-remove-${entry.origin}`}
                onClick={() => {
                  setConfirmKind("remove");
                }}
              >
                {t("settings.integrations.sdk.origins.delete")}
              </Button>
            </div>
          </div>
        </div>
      </AccordionContent>

      <SdkModuleSettingsOriginConfirmDialog
        origin={entry.origin}
        kind={confirmKind}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmKind(null);
          }
        }}
        onConfirm={confirmDestructive}
      />
    </AccordionItem>
  );
}
