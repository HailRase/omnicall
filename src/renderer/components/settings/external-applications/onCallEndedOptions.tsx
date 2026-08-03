/**
 * - Purpose: build localized onCallEnded illustrated card option list.
 * - Inputs: translator for titles, descriptions, and schematic captions.
 * - Outputs: leave / minimize / close option descriptors with schematics.
 */

import type { ReactNode } from "react";
import type { Translator } from "../../../i18n/index.js";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import {
  CloseSchematic,
  LeaveOpenSchematic,
  MinimizeSchematic,
} from "./OnCallEndedSchematics.js";

export type OnCallEndedChoice =
  ExternalApplicationsPanelApplication["windowBehavior"]["onCallEnded"];

export type OnCallEndedOption = Readonly<{
  value: OnCallEndedChoice;
  title: string;
  description: string;
  schematic: ReactNode;
}>;

export function buildOnCallEndedOptions(t: Translator): readonly OnCallEndedOption[] {
  const softphone = t(
    "settings.integrations.externalApplications.openMode.preview.softphone",
  );
  const appWindow = t(
    "settings.integrations.externalApplications.openMode.preview.appWindow",
  );
  const labels = { softphone, appWindow };

  return [
    {
      value: "leave",
      title: t(
        "settings.integrations.externalApplications.windowBehavior.onCallEnded.leave",
      ),
      description: t(
        "settings.integrations.externalApplications.windowBehavior.onCallEnded.leave.description",
      ),
      schematic: <LeaveOpenSchematic {...labels} />,
    },
    {
      value: "minimize",
      title: t(
        "settings.integrations.externalApplications.windowBehavior.onCallEnded.minimize",
      ),
      description: t(
        "settings.integrations.externalApplications.windowBehavior.onCallEnded.minimize.description",
      ),
      schematic: <MinimizeSchematic {...labels} />,
    },
    {
      value: "close",
      title: t(
        "settings.integrations.externalApplications.windowBehavior.onCallEnded.close",
      ),
      description: t(
        "settings.integrations.externalApplications.windowBehavior.onCallEnded.close.description",
      ),
      schematic: <CloseSchematic {...labels} />,
    },
  ];
}
