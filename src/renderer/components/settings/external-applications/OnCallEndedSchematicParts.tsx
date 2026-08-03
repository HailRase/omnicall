/**
 * - Purpose: shared SVG building blocks for onCallEnded desktop previews.
 * - Inputs: coordinates and localized captions for softphone / card window.
 * - Outputs: aria-hidden desktop stage, softphone, and card window fragments.
 */

import type { JSX } from "react";
import { useId } from "react";
import styles from "./OnCallEndedChoiceCards.module.css";

const DESKTOP_X = 4;
const DESKTOP_Y = 2;
const DESKTOP_W = 190;
const DESKTOP_H = 106;
const TASKBAR_Y = 96;

function DesktopClip({ clipId }: Readonly<{ clipId: string }>): JSX.Element {
  return (
    <defs>
      <clipPath id={clipId}>
        <rect
          x={DESKTOP_X}
          y={DESKTOP_Y}
          width={DESKTOP_W}
          height={DESKTOP_H}
          rx="8"
          ry="8"
        />
      </clipPath>
    </defs>
  );
}

export function DesktopStage(): JSX.Element {
  const clipId = `on-call-ended-desktop-${useId().replaceAll(":", "")}`;

  return (
    <>
      <DesktopClip clipId={clipId} />
      <g clipPath={`url(#${clipId})`}>
        <rect
          className={styles.schematicDesktop}
          x={DESKTOP_X}
          y={DESKTOP_Y}
          width={DESKTOP_W}
          height={DESKTOP_H}
        />
        <rect
          className={styles.schematicTaskbar}
          x={DESKTOP_X}
          y={TASKBAR_Y}
          width={DESKTOP_W}
          height="12"
        />
      </g>
      <rect
        className={styles.schematicDesktopOutline}
        x={DESKTOP_X}
        y={DESKTOP_Y}
        width={DESKTOP_W}
        height={DESKTOP_H}
        rx="8"
        ry="8"
      />
    </>
  );
}

function SoftphoneKeypad({ x, y }: Readonly<{ x: number; y: number }>): JSX.Element {
  return (
    <>
      <rect className={styles.schematicSoftphoneInner} x={x} y={y} width="10" height="8" rx="1.5" />
      <rect
        className={styles.schematicSoftphoneInner}
        x={x + 12}
        y={y}
        width="10"
        height="8"
        rx="1.5"
      />
      <rect
        className={styles.schematicSoftphoneInner}
        x={x + 24}
        y={y}
        width="10"
        height="8"
        rx="1.5"
      />
      <rect
        className={styles.schematicSoftphoneInner}
        x={x}
        y={y + 12}
        width="34"
        height="6"
        rx="1.5"
      />
    </>
  );
}

export function SoftphonePanel({ x, y }: Readonly<{ x: number; y: number }>): JSX.Element {
  return (
    <g>
      <rect className={styles.schematicSoftphone} x={x} y={y} width="44" height="70" rx="5" />
      <rect
        className={styles.schematicSoftphoneHeader}
        x={x + 5}
        y={y + 6}
        width="34"
        height="10"
        rx="2"
      />
      <circle className={styles.schematicStatus} cx={x + 11} cy={y + 11} r="2" />
      <rect
        className={styles.schematicSoftphoneInner}
        x={x + 5}
        y={y + 22}
        width="34"
        height="18"
        rx="2"
      />
      <SoftphoneKeypad x={x + 5} y={y + 46} />
    </g>
  );
}

export function Caption({
  x,
  y,
  text,
}: Readonly<{ x: number; y: number; text: string }>): JSX.Element {
  return (
    <text className={styles.schematicCaption} x={x} y={y} textAnchor="middle">
      {text}
    </text>
  );
}

function WindowControls({ x, y }: Readonly<{ x: number; y: number }>): JSX.Element {
  return (
    <>
      <circle className={styles.schematicDot} cx={x} cy={y} r="2.5" />
      <circle className={styles.schematicDot} cx={x + 8} cy={y} r="2.5" />
      <circle className={styles.schematicDot} cx={x + 16} cy={y} r="2.5" />
    </>
  );
}

export function AppCardWindow({
  className,
}: Readonly<{ className?: string }>): JSX.Element {
  return (
    <g className={className}>
      <rect className={styles.schematicTargetFrame} x="78" y="16" width="100" height="68" rx="6" />
      <rect className={styles.schematicTitleBar} x="78" y="16" width="100" height="16" rx="6" />
      <rect className={styles.schematicTitleBar} x="78" y="26" width="100" height="6" />
      <WindowControls x={88} y={24} />
      <rect className={styles.schematicContent} x="88" y="38" width="80" height="10" rx="2" />
      <rect className={styles.schematicContent} x="88" y="52" width="56" height="8" rx="2" />
      <rect className={styles.schematicContentMuted} x="88" y="64" width="66" height="8" rx="2" />
    </g>
  );
}

export function MinimizeTaskbarStrip(): JSX.Element {
  return (
    <rect
      className={`${styles.schematicMinimizeStrip} ${styles.sceneMinimizeStrip}`}
      x="118"
      y="99"
      width="28"
      height="5"
      rx="1.5"
    />
  );
}
