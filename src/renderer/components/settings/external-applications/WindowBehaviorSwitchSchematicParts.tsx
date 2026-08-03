/**
 * - Purpose: shared SVG building blocks for window-behavior switch previews.
 * - Inputs: coordinates and localized captions for card / foreign windows.
 * - Outputs: aria-hidden desktop stage, softphone, card, foreign window, pin.
 */

import type { JSX } from "react";
import { useId } from "react";
import { AppIcon } from "../../icons/AppIcon.js";
import styles from "./WindowBehaviorSwitchSchematics.module.css";

const DESKTOP_X = 4;
const DESKTOP_Y = 2;
const DESKTOP_W = 190;
const DESKTOP_H = 106;
const TASKBAR_Y = 96;

export function DesktopStage(): JSX.Element {
  const clipId = `wb-switch-desktop-${useId().replaceAll(":", "")}`;

  return (
    <>
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

export function CardWindow({ className }: Readonly<{ className?: string }>): JSX.Element {
  return (
    <g className={className}>
      <rect className={styles.schematicCardFrame} x="86" y="20" width="88" height="60" rx="6" />
      <rect className={styles.schematicTitleBar} x="86" y="20" width="88" height="14" rx="6" />
      <rect className={styles.schematicTitleBar} x="86" y="28" width="88" height="6" />
      <circle className={styles.schematicDot} cx="96" cy="27" r="2.2" />
      <circle className={styles.schematicDot} cx="104" cy="27" r="2.2" />
      <circle className={styles.schematicDot} cx="112" cy="27" r="2.2" />
      <rect className={styles.schematicContent} x="96" y="40" width="68" height="9" rx="2" />
      <rect className={styles.schematicContent} x="96" y="53" width="48" height="7" rx="2" />
      <rect className={styles.schematicContentMuted} x="96" y="64" width="56" height="7" rx="2" />
    </g>
  );
}

export function ForeignWindow({ className }: Readonly<{ className?: string }>): JSX.Element {
  return (
    <g className={className}>
      <rect className={styles.schematicForeignFrame} x="70" y="28" width="92" height="58" rx="6" />
      <rect className={styles.schematicForeignTitle} x="70" y="28" width="92" height="14" rx="6" />
      <rect className={styles.schematicForeignTitle} x="70" y="36" width="92" height="6" />
      <circle className={styles.schematicDotMuted} cx="80" cy="35" r="2.2" />
      <circle className={styles.schematicDotMuted} cx="88" cy="35" r="2.2" />
      <circle className={styles.schematicDotMuted} cx="96" cy="35" r="2.2" />
      <rect className={styles.schematicContentMuted} x="80" y="48" width="72" height="8" rx="2" />
      <rect className={styles.schematicContentMuted} x="80" y="60" width="52" height="7" rx="2" />
    </g>
  );
}

type SmallForeignWindowProps = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
}>;

/** Compact third-party window used in always-on-top multi-app scenes. */
export function SmallForeignWindow({
  x,
  y,
  width,
  height,
  className,
}: SmallForeignWindowProps): JSX.Element {
  const titleH = 10;
  const pad = 5;

  return (
    <g className={className}>
      <rect
        className={styles.schematicForeignFrame}
        x={x}
        y={y}
        width={width}
        height={height}
        rx="4"
      />
      <rect
        className={styles.schematicForeignTitle}
        x={x}
        y={y}
        width={width}
        height={titleH}
        rx="4"
      />
      <rect
        className={styles.schematicForeignTitle}
        x={x}
        y={y + 6}
        width={width}
        height={4}
      />
      <circle className={styles.schematicDotMuted} cx={x + 7} cy={y + 5} r="1.6" />
      <circle className={styles.schematicDotMuted} cx={x + 13} cy={y + 5} r="1.6" />
      <rect
        className={styles.schematicContentMuted}
        x={x + pad}
        y={y + titleH + 3}
        width={width - pad * 2}
        height={Math.max(5, height - titleH - 10)}
        rx="1.5"
      />
    </g>
  );
}

/** Background cluster of small third-party apps behind the OmniCall card. */
export function ForeignAppsCluster({
  className,
}: Readonly<{ className?: string }>): JSX.Element {
  return (
    <g className={className}>
      <SmallForeignWindow x={62} y={14} width={52} height={36} />
      <SmallForeignWindow x={128} y={18} width={48} height={32} />
      <SmallForeignWindow x={78} y={48} width={56} height={38} />
      <SmallForeignWindow x={140} y={52} width={44} height={34} />
    </g>
  );
}

/** Pin badge on OmniCall card: Lucide Pin via AppIcon (shell.window.pin). */
export function PinBadge({ className }: Readonly<{ className?: string }>): JSX.Element {
  return (
    <g className={className}>
      <foreignObject x="154" y="16" width="20" height="20">
        <div className={styles.pinIconHost}>
          <AppIcon id="shell.window.pin" size={13} decorative preferAnimated={false} />
        </div>
      </foreignObject>
    </g>
  );
}
