import type { JSX, ReactNode } from "react";
import styles from "./SoftphoneLayout.module.css";

export type SoftphoneLayoutProps = Readonly<{
  header: ReactNode;
  context: ReactNode;
  controls: ReactNode;
  overlays: ReactNode;
}>;

/**
 * - Purpose: four-zone desktop shell (header, context, controls, overlay layer).
 * - Inputs: slot nodes for each layout zone.
 * - Outputs: structured layout with stable zone test IDs for smoke and Storybook.
 * @uiMeta lf=LF-011 f=F-014 smoke=R7-*
 */
export function SoftphoneLayout({
  header,
  context,
  controls,
  overlays,
}: SoftphoneLayoutProps): JSX.Element {
  return (
    <div className={styles["layout"]} data-testid="softphone-layout">
      <div className={styles["header"]} data-testid="layout-header-zone">
        {header}
      </div>
      <div className={styles["main"]}>
        <div className={styles["context"]} data-testid="layout-context-zone">
          {context}
        </div>
        <div className={styles["controls"]} data-testid="layout-controls-zone">
          {controls}
        </div>
      </div>
      <div className={styles["overlays"]} data-testid="layout-overlay-layer">
        {overlays}
      </div>
    </div>
  );
}
