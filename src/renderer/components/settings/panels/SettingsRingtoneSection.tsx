import { useEffect, useMemo, useState, type JSX } from "react";
import {
  listIncomingRingtoneIds,
  parseIncomingRingtoneId,
  type IncomingRingtoneId,
} from "@application/index.js";
import { useI18n, type TranslationKey } from "../../../i18n/index.js";
import { IconButton, Select } from "../../ui/index.js";
import type { SelectItemOption } from "../../ui/select/Select.js";
import formStyles from "../SettingsForm.module.css";

const RINGTONE_PREVIEW_MS = 4000;

const RINGTONE_LABEL_KEYS: Readonly<Record<IncomingRingtoneId, TranslationKey>> = {
  classic: "settings.sessions.ringtone.preset.classic",
  "soft-chime": "settings.sessions.ringtone.preset.softChime",
  "digital-pulse": "settings.sessions.ringtone.preset.digitalPulse",
  "marimba-like": "settings.sessions.ringtone.preset.marimbaLike",
  "triad-bell": "settings.sessions.ringtone.preset.triadBell",
  "office-ring": "settings.sessions.ringtone.preset.officeRing",
  "gentle-pluck": "settings.sessions.ringtone.preset.gentlePluck",
  "bright-alert": "settings.sessions.ringtone.preset.brightAlert",
  "warm-bells": "settings.sessions.ringtone.preset.warmBells",
  "minimal-beep": "settings.sessions.ringtone.preset.minimalBeep",
  "night-soft": "settings.sessions.ringtone.preset.nightSoft",
  "crystal-tone": "settings.sessions.ringtone.preset.crystalTone",
};

export type SettingsRingtoneSectionProps = Readonly<{
  incomingRingtoneId: IncomingRingtoneId;
  onIncomingRingtoneIdChange: (ringtoneId: IncomingRingtoneId) => void;
  onPreviewIncomingRingtone: (ringtoneId: IncomingRingtoneId) => void;
  onStopIncomingRingtonePreview: () => void;
}>;

/**
 * - Purpose: select and preview incoming ringtone preset in Settings → Sessions.
 * - Inputs: selected ringtone id and preview/change callbacks.
 * - Outputs: accessible select + volume IconButton toggle without facade access.
 */
export function SettingsRingtoneSection({
  incomingRingtoneId,
  onIncomingRingtoneIdChange,
  onPreviewIncomingRingtone,
  onStopIncomingRingtonePreview,
}: SettingsRingtoneSectionProps): JSX.Element {
  const { t } = useI18n();
  const [previewActive, setPreviewActive] = useState(false);

  const ringtoneItems = useMemo<ReadonlyArray<SelectItemOption>>(
    () =>
      listIncomingRingtoneIds().map((id) => ({
        value: id,
        label: t(RINGTONE_LABEL_KEYS[id]),
      })),
    [t],
  );

  useEffect(() => {
    return () => {
      onStopIncomingRingtonePreview();
    };
  }, [onStopIncomingRingtonePreview]);

  useEffect(() => {
    if (!previewActive) {
      return;
    }
    const timer = window.setTimeout(() => {
      onStopIncomingRingtonePreview();
      setPreviewActive(false);
    }, RINGTONE_PREVIEW_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [previewActive, onStopIncomingRingtonePreview]);

  function handleRingtoneChange(value: string): void {
    const parsed = parseIncomingRingtoneId(value);
    if (parsed === null) {
      return;
    }
    if (previewActive) {
      onStopIncomingRingtonePreview();
      setPreviewActive(false);
    }
    onIncomingRingtoneIdChange(parsed);
  }

  function handlePreviewToggle(): void {
    if (previewActive) {
      onStopIncomingRingtonePreview();
      setPreviewActive(false);
      return;
    }
    onPreviewIncomingRingtone(incomingRingtoneId);
    setPreviewActive(true);
  }

  const previewAriaLabel = previewActive
    ? t("icons.settings.sessions.ringtone.previewStop")
    : t("icons.settings.sessions.ringtone.preview");

  return (
    <fieldset className={formStyles.sectionCard}>
      <legend className={formStyles.sectionTitle}>
        {t("settings.sessions.ringtone.legend")}
      </legend>
      <div className={formStyles.settingsGroup}>
        <div className={formStyles.settingBlock}>
          <label
            className={formStyles.fieldLabelGroup}
            htmlFor="settings-incoming-ringtone-select"
          >
            <span className={formStyles.fieldLabel} id="settings-incoming-ringtone-label">
              {t("settings.sessions.ringtone.label")}
            </span>
            <span className={formStyles.fieldDescription}>
              {t("settings.sessions.ringtone.description")}
            </span>
          </label>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.languageSelectField}>
              <Select
                id="settings-incoming-ringtone-select"
                data-testid="settings-incoming-ringtone-select"
                aria-labelledby="settings-incoming-ringtone-label"
                items={ringtoneItems}
                value={incomingRingtoneId}
                onValueChange={handleRingtoneChange}
              />
            </div>
            <IconButton
              iconId={
                previewActive
                  ? "settings.sessions.ringtone.previewStop"
                  : "settings.sessions.ringtone.preview"
              }
              ariaLabel={previewAriaLabel}
              tooltipLabel={previewAriaLabel}
              variant={previewActive ? "primary" : "outline"}
              size="sm"
              aria-pressed={previewActive}
              data-testid="settings-incoming-ringtone-preview"
              onClick={handlePreviewToggle}
            />
          </div>
          <p className={formStyles.blockHint} data-testid="settings-incoming-ringtone-hint">
            {t("settings.sessions.ringtone.hint")}
          </p>
        </div>
      </div>
    </fieldset>
  );
}
