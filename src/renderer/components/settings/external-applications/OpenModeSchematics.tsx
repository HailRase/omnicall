/**
 * - Purpose: decorative desktop-scene SVG previews for open-mode cards.
 * - Inputs: localized short labels for softphone, target window, browser, URL hint.
 * - Outputs: aria-hidden inline SVG scenes for electron_window and external_browser.
 */

import type { JSX } from "react";
import { useId } from "react";
import styles from "./OpenModeChoiceCards.module.css";

export type OpenModeSchematicLabels = Readonly<{
  softphone: string;
  appWindow: string;
  browser: string;
  addressHint: string;
}>;

/** Extra horizontal inset for the desktop stage inside the SVG viewBox. */
const DESKTOP_X = 4;
const DESKTOP_Y = 2;
const DESKTOP_W = 190;
const DESKTOP_H = 106;
const TASKBAR_Y = 96;

function DesktopStage(): JSX.Element {
  const clipId = `open-mode-desktop-${useId().replaceAll(":", "")}`;

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

function SoftphonePanel({ x, y }: Readonly<{ x: number; y: number }>): JSX.Element {
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

function FlowArrow(): JSX.Element {
  return (
    <g className={styles.schematicArrow}>
      <path className={styles.schematicArrowPath} d="M68 48 H84" fill="none" />
      <path className={styles.schematicArrowPath} d="M80 43 L87 48 L80 53" fill="none" />
    </g>
  );
}

function Caption({
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

function AppWindowTarget(): JSX.Element {
  return (
    <g className={styles.schematicTarget}>
      <rect className={styles.schematicTargetFrame} x="96" y="16" width="84" height="68" rx="6" />
      <rect className={styles.schematicTitleBar} x="96" y="16" width="84" height="16" rx="6" />
      <rect className={styles.schematicTitleBar} x="96" y="26" width="84" height="6" />
      <WindowControls x={106} y={24} />
      <rect className={styles.schematicContent} x="104" y="38" width="68" height="10" rx="2" />
      <rect className={styles.schematicContent} x="104" y="52" width="48" height="8" rx="2" />
      <rect className={styles.schematicContentMuted} x="104" y="64" width="56" height="8" rx="2" />
    </g>
  );
}

function BrowserTarget({
  addressHint,
}: Readonly<{ addressHint: string }>): JSX.Element {
  return (
    <g className={styles.schematicTarget}>
      <rect className={styles.schematicTargetFrame} x="96" y="14" width="84" height="72" rx="6" />
      <rect className={styles.schematicBrowserChrome} x="96" y="14" width="84" height="20" rx="6" />
      <rect className={styles.schematicBrowserChrome} x="96" y="28" width="84" height="6" />
      <rect className={styles.schematicAddressBar} x="102" y="18" width="72" height="12" rx="6" />
      <text className={styles.schematicAddressText} x="138" y="27" textAnchor="middle">
        {addressHint}
      </text>
      <rect className={styles.schematicContent} x="104" y="40" width="68" height="38" rx="3" />
    </g>
  );
}

/**
 * Softphone opens a built-in OmniCall window on the same desktop.
 */
export function ElectronWindowSchematic({
  softphone,
  appWindow,
}: Pick<OpenModeSchematicLabels, "softphone" | "appWindow">): JSX.Element {
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
      <FlowArrow />
      <AppWindowTarget />
      <Caption x={138} y={92} text={appWindow} />
    </svg>
  );
}

/**
 * Softphone opens the page in the OS external browser.
 */
export function ExternalBrowserSchematic({
  softphone,
  browser,
  addressHint,
}: Pick<OpenModeSchematicLabels, "softphone" | "browser" | "addressHint">): JSX.Element {
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
      <FlowArrow />
      <BrowserTarget addressHint={addressHint} />
      <Caption x={138} y={94} text={browser} />
    </svg>
  );
}
