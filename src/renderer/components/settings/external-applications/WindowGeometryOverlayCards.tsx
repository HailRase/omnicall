/**
 * - Purpose: read-only overlay cards for peer External Applications on the preview.
 * - Inputs: active peers, preview scale, disabled flag, remove callback.
 * - Outputs: non-draggable preview cards with accessible remove controls.
 */

import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { IconControlButton } from "../../icons/IconControlButton.js";
import { realToPreview } from "./windowGeometryMath.js";
import type { GeometryOverlayPeer } from "./windowGeometryOverlayTypes.js";
import styles from "./WindowGeometryOverlays.module.css";

export type WindowGeometryOverlayCardsProps = Readonly<{
  peers: ReadonlyArray<GeometryOverlayPeer>;
  scale: number;
  disabled: boolean;
  onRemove: (id: GeometryOverlayPeer["id"]) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function WindowGeometryOverlayCards({
  peers,
  scale,
  disabled,
  onRemove,
}: WindowGeometryOverlayCardsProps): JSX.Element | null {
  const { t } = useI18n();

  if (peers.length === 0) {
    return null;
  }

  return (
    <>
      {peers.map((peer) => {
        const removeLabel = t(
          "settings.integrations.externalApplications.windowGeometry.overlays.removeAria",
          { name: peer.name },
        );
        return (
          <div
            key={peer.id}
            className={styles.overlayCard}
            data-testid={`external-applications-geometry-overlay-card-${peer.id}`}
            style={{
              left: realToPreview(peer.window.x, scale),
              top: realToPreview(peer.window.y, scale),
              width: realToPreview(peer.window.width, scale),
              height: realToPreview(peer.window.height, scale),
            }}
          >
            <div className={styles.overlayTitlebar}>
              <span className={styles.overlayLabel} aria-hidden="true">
                {peer.name}
              </span>
              <span className={styles.overlayRemove}>
                <IconControlButton
                  iconId="overlay.close"
                  ariaLabel={removeLabel}
                  tooltipLabel={removeLabel}
                  disabled={disabled}
                  testId={`external-applications-geometry-overlay-remove-preview-${peer.id}`}
                  onClick={() => {
                    onRemove(peer.id);
                  }}
                />
              </span>
            </div>
            <div className={styles.overlayBody} aria-hidden="true" />
          </div>
        );
      })}
    </>
  );
}
