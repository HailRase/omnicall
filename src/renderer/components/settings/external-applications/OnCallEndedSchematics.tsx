/**
 * - Purpose: decorative desktop-scene SVG previews for onCallEnded cards.
 * - Inputs: localized short labels for softphone and card window.
 * - Outputs: aria-hidden leave / minimize / close post-call outcome scenes.
 */

import type { JSX, ReactNode } from "react";
import styles from "./OnCallEndedChoiceCards.module.css";
import {
  AppCardWindow,
  Caption,
  DesktopStage,
  MinimizeTaskbarStrip,
  SoftphonePanel,
} from "./OnCallEndedSchematicParts.js";

export type OnCallEndedSchematicLabels = Readonly<{
  softphone: string;
  appWindow: string;
}>;

function SceneShell({
  softphone,
  appWindow,
  children,
}: OnCallEndedSchematicLabels & { children: ReactNode }): JSX.Element {
  return (
    <svg
      className={styles.schematicSvg}
      viewBox="0 0 200 110"
      aria-hidden="true"
      focusable="false"
    >
      <DesktopStage />
      <SoftphonePanel x={16} y={14} />
      <Caption x={38} y={92} text={softphone} />
      {children}
      <Caption x={128} y={92} text={appWindow} />
    </svg>
  );
}

/** Card window remains open after the call ends. */
export function LeaveOpenSchematic({
  softphone,
  appWindow,
}: OnCallEndedSchematicLabels): JSX.Element {
  return (
    <SceneShell softphone={softphone} appWindow={appWindow}>
      <AppCardWindow className={styles.sceneLeaveWindow} />
    </SceneShell>
  );
}

/** Card window shrinks toward the taskbar after the call ends. */
export function MinimizeSchematic({
  softphone,
  appWindow,
}: OnCallEndedSchematicLabels): JSX.Element {
  return (
    <SceneShell softphone={softphone} appWindow={appWindow}>
      <AppCardWindow className={styles.sceneMinimizeWindow} />
      <MinimizeTaskbarStrip />
    </SceneShell>
  );
}

/** Card window fades away after the call ends. */
export function CloseSchematic({
  softphone,
  appWindow,
}: OnCallEndedSchematicLabels): JSX.Element {
  return (
    <SceneShell softphone={softphone} appWindow={appWindow}>
      <AppCardWindow className={styles.sceneCloseWindow} />
    </SceneShell>
  );
}
