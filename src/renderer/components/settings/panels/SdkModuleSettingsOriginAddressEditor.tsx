import type { ChangeEvent, JSX } from "react";
import { useEffect, useId, useState } from "react";
import { useI18n } from "../../../i18n/index.js";
import { IconButton, Input } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";

type Props = Readonly<{
  origin: string;
  busy: boolean;
  onRenameAllowedOrigin: (previousOrigin: string, nextOrigin: string) => void;
}>;

/**
 * - Purpose: site address on one row with UI Kit IconButton edit/save/cancel + tooltips.
 */
export function SdkModuleSettingsOriginAddressEditor({
  origin,
  busy,
  onRenameAllowedOrigin,
}: Props): JSX.Element {
  const { t } = useI18n();
  const inputId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(origin);

  useEffect(() => {
    setDraft(origin);
    setEditing(false);
  }, [origin]);

  const trimmed = draft.trim();
  const isDirty = trimmed !== origin;
  const canSave = !busy && trimmed.length > 0 && isDirty;

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setDraft(event.target.value);
  }

  function beginEdit(): void {
    setDraft(origin);
    setEditing(true);
  }

  function cancelEdit(): void {
    setDraft(origin);
    setEditing(false);
  }

  function saveEdit(): void {
    if (!canSave) {
      return;
    }
    onRenameAllowedOrigin(origin, trimmed);
    setEditing(false);
  }

  return (
    <div className={styles.addressBlock}>
      <label className={formStyles.fieldLabel} htmlFor={inputId}>
        {t("settings.integrations.sdk.origins.addressLabel")}
      </label>
      <div className={styles.addressRow}>
        {editing ? (
          <>
            <Input
              id={inputId}
              className={styles.addressInput}
              size="sm"
              value={draft}
              disabled={busy}
              aria-label={t("settings.integrations.sdk.origins.editLabel")}
              data-testid={`sdk-origin-edit-input-${origin}`}
              onChange={handleChange}
            />
            <div className={styles.addressActions}>
              <IconButton
                iconId="action.confirm"
                ariaLabel={t("settings.integrations.sdk.origins.editSave")}
                tooltipLabel={t("settings.integrations.sdk.origins.editSave")}
                variant="ghost"
                size="sm"
                disabled={!canSave}
                data-testid={`sdk-origin-edit-save-${origin}`}
                onClick={saveEdit}
              />
              <IconButton
                iconId="overlay.close"
                ariaLabel={t("settings.integrations.sdk.origins.editCancel")}
                tooltipLabel={t("settings.integrations.sdk.origins.editCancel")}
                variant="ghost"
                size="sm"
                disabled={busy}
                data-testid={`sdk-origin-edit-cancel-${origin}`}
                onClick={cancelEdit}
              />
            </div>
          </>
        ) : (
          <>
            <Input
              id={inputId}
              className={styles.addressInput}
              size="sm"
              value={origin}
              readOnly
              data-testid={`sdk-origin-address-${origin}`}
            />
            <div className={styles.addressActions}>
              <IconButton
                iconId="action.edit"
                ariaLabel={t("settings.integrations.sdk.origins.editStart")}
                tooltipLabel={t("settings.integrations.sdk.origins.editStart")}
                variant="ghost"
                size="sm"
                disabled={busy}
                data-testid={`sdk-origin-edit-${origin}`}
                onClick={beginEdit}
              />
            </div>
          </>
        )}
      </div>
      {editing ? (
        <p className={formStyles.blockHint}>
          {isDirty
            ? t("settings.integrations.sdk.origins.unsavedHint")
            : t("settings.integrations.sdk.origins.editHint")}
        </p>
      ) : null}
    </div>
  );
}
