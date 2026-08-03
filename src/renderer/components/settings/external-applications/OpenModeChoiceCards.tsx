/**
 * - Purpose: illustrated radio cards for External Applications open mode.
 * - Inputs: selected openMode, busy/disabled flag, change callback.
 * - Outputs: accessible RadioGroup selection intents for draft update.
 */

import type { JSX, ReactNode } from "react";
import { useId } from "react";
import { useI18n, type Translator } from "../../../i18n/index.js";
import { RadioGroup, RadioGroupItem } from "../../ui/index.js";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import styles from "./OpenModeChoiceCards.module.css";
import {
  ElectronWindowSchematic,
  ExternalBrowserSchematic,
} from "./OpenModeSchematics.js";

export type OpenModeChoice = ExternalApplicationsPanelApplication["openMode"];

export type OpenModeChoiceCardsProps = Readonly<{
  value: OpenModeChoice;
  disabled: boolean;
  onChange: (openMode: OpenModeChoice) => void;
}>;

type OpenModeCardProps = Readonly<{
  value: OpenModeChoice;
  title: string;
  description: string;
  disabled: boolean;
  schematic: ReactNode;
}>;

type OpenModeOption = Readonly<{
  value: OpenModeChoice;
  title: string;
  description: string;
  schematic: ReactNode;
}>;

function OpenModeCard({
  value,
  title,
  description,
  disabled,
  schematic,
}: OpenModeCardProps): JSX.Element {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <label className={styles.card} data-disabled={disabled ? "true" : undefined}>
      <div className={styles.cardHeader}>
        <RadioGroupItem
          value={value}
          disabled={disabled}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        />
        <span id={titleId} className={styles.cardTitle}>
          {title}
        </span>
      </div>
      <p id={descriptionId} className={styles.cardDescription}>
        {description}
      </p>
      <div className={styles.schematic} aria-hidden="true">
        {schematic}
      </div>
    </label>
  );
}

function buildOpenModeOptions(t: Translator): readonly OpenModeOption[] {
  const softphone = t(
    "settings.integrations.externalApplications.openMode.preview.softphone",
  );
  const appWindow = t(
    "settings.integrations.externalApplications.openMode.preview.appWindow",
  );
  const browser = t(
    "settings.integrations.externalApplications.openMode.preview.browser",
  );
  const addressHint = t(
    "settings.integrations.externalApplications.openMode.preview.addressHint",
  );

  return [
    {
      value: "electron_window",
      title: t("settings.integrations.externalApplications.openMode.electronWindow"),
      description: t(
        "settings.integrations.externalApplications.openMode.electronWindow.description",
      ),
      schematic: <ElectronWindowSchematic softphone={softphone} appWindow={appWindow} />,
    },
    {
      value: "external_browser",
      title: t("settings.integrations.externalApplications.openMode.externalBrowser"),
      description: t(
        "settings.integrations.externalApplications.openMode.externalBrowser.description",
      ),
      schematic: (
        <ExternalBrowserSchematic
          softphone={softphone}
          browser={browser}
          addressHint={addressHint}
        />
      ),
    },
  ];
}

function handleOpenModeChange(
  next: string,
  onChange: (openMode: OpenModeChoice) => void,
): void {
  if (next === "electron_window" || next === "external_browser") {
    onChange(next);
  }
}

/**
 * @uiMeta f=F-032
 */
export function OpenModeChoiceCards({
  value,
  disabled,
  onChange,
}: OpenModeChoiceCardsProps): JSX.Element {
  const { t } = useI18n();
  const labelId = useId();
  const options = buildOpenModeOptions(t);

  return (
    <div className={styles.field}>
      <p id={labelId} className={styles.fieldLabel}>
        {t("settings.integrations.externalApplications.openMode")}
      </p>
      <RadioGroup
        value={value}
        disabled={disabled}
        orientation="horizontal"
        className={styles.group}
        aria-labelledby={labelId}
        data-testid="external-applications-open-mode"
        onValueChange={(next) => {
          handleOpenModeChange(next, onChange);
        }}
      >
        {options.map((option) => (
          <OpenModeCard
            key={option.value}
            value={option.value}
            disabled={disabled}
            title={option.title}
            description={option.description}
            schematic={option.schematic}
          />
        ))}
      </RadioGroup>
    </div>
  );
}
