import type { JSX, ReactNode } from "react";

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
    <div className="softphone-layout" data-testid="softphone-layout">
      <div className="softphone-layout__header" data-testid="layout-header-zone">
        {header}
      </div>
      <div className="softphone-layout__main">
        <div className="softphone-layout__context" data-testid="layout-context-zone">
          {context}
        </div>
        <div className="softphone-layout__controls" data-testid="layout-controls-zone">
          {controls}
        </div>
      </div>
      <div className="softphone-layout__overlays" data-testid="layout-overlay-layer">
        {overlays}
      </div>
    </div>
  );
}
