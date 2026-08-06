/**
 * - Purpose: decorative desktop-scene SVG previews for window-behavior switches.
 * - Inputs: kind, active flag, localized short labels for card / other window.
 * - Outputs: aria-hidden raiseOnOpen and alwaysOnTopDuringCall outcome scenes.
 */

import type { JSX, ReactNode } from "react";
import styles from "./WindowBehaviorSwitchSchematics.module.css";
import {
  Caption,
  CardWindow,
  DesktopStage,
  ForeignAppsCluster,
  ForeignWindow,
  PinBadge,
  SoftphonePanel,
} from "./WindowBehaviorSwitchSchematicParts.js";

export type WindowBehaviorSwitchSchematicKind = "raise" | "always-on-top";

export type WindowBehaviorSwitchSchematicLabels = Readonly<{
  softphone: string;
  appWindow: string;
  otherWindow: string;
}>;

type SceneShellProps = WindowBehaviorSwitchSchematicLabels &
  Readonly<{
    kind: WindowBehaviorSwitchSchematicKind;
    active: boolean;
    showOtherCaption?: boolean;
    children: ReactNode;
  }>;

function SceneShell({
  kind,
  active,
  softphone,
  appWindow,
  otherWindow,
  showOtherCaption = true,
  children,
}: SceneShellProps): JSX.Element {
  return (
    <svg
      className={styles.schematicSvg}
      viewBox="0 0 200 110"
      aria-hidden="true"
      focusable="false"
      data-kind={kind}
      data-active={active ? "true" : "false"}
    >
      <DesktopStage />
      <SoftphonePanel x={14} y={16} />
      <Caption x={36} y={94} text={softphone} />
      {children}
      {showOtherCaption ? <Caption x={108} y={94} text={otherWindow} /> : null}
      <Caption x={showOtherCaption ? 158 : 140} y={94} text={appWindow} />
    </svg>
  );
}

/** Card raises in front when open; OFF keeps card partially covered. */
export function RaiseOnOpenSchematic({
  active,
  softphone,
  appWindow,
  otherWindow,
}: WindowBehaviorSwitchSchematicLabels & { active: boolean }): JSX.Element {
  const foreign = <ForeignWindow className={styles.sceneForeign} />;
  const card = <CardWindow className={styles.sceneCard} />;

  return (
    <SceneShell
      kind="raise"
      active={active}
      softphone={softphone}
      appWindow={appWindow}
      otherWindow={otherWindow}
    >
      {active ? (
        <>
          {foreign}
          {card}
        </>
      ) : (
        <>
          {card}
          {foreign}
        </>
      )}
    </SceneShell>
  );
}

/** Card floats above several third-party apps; OFF lets them cover the card. */
export function AlwaysOnTopSchematic({
  active,
  softphone,
  appWindow,
  otherWindow,
}: WindowBehaviorSwitchSchematicLabels & { active: boolean }): JSX.Element {
  const cluster = <ForeignAppsCluster className={styles.sceneForeignCluster} />;
  const card = <CardWindow className={styles.sceneCard} />;
  const pin = active ? <PinBadge className={styles.scenePin} /> : null;

  return (
    <SceneShell
      kind="always-on-top"
      active={active}
      softphone={softphone}
      appWindow={appWindow}
      otherWindow={otherWindow}
      showOtherCaption={false}
    >
      {active ? (
        <>
          {cluster}
          {card}
          {pin}
        </>
      ) : (
        <>
          {card}
          {cluster}
        </>
      )}
    </SceneShell>
  );
}
