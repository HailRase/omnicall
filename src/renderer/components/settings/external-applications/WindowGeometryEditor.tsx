/**
 * - Purpose: General-tab window layout editor for electron_window apps.
 * - Inputs: window draft, app name, peers list, disabled flag, change callback.
 * - Outputs: left preview + right controls (presets, px fields).
 */

import { useMemo, type JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import { useWindowGeometryOverlaySelection } from "./useWindowGeometryOverlaySelection.js";
import { WindowGeometryOverlayCards } from "./WindowGeometryOverlayCards.js";
import { WindowGeometryOverlays } from "./WindowGeometryOverlays.js";
import { WindowGeometryPositionFields } from "./WindowGeometryPositionFields.js";
import { WindowGeometryPresetChips } from "./WindowGeometryPresetChips.js";
import { WindowGeometryPreview } from "./WindowGeometryPreview.js";
import { WindowGeometrySizeFields } from "./WindowGeometrySizeFields.js";
import {
  listEligibleOverlayPeers,
  toGeometryOverlayPeer,
  type GeometryOverlayPeer,
} from "./windowGeometryOverlayTypes.js";
import styles from "./WindowGeometryEditor.module.css";

export type WindowGeometry = ExternalApplicationsPanelApplication["window"];

export type WindowGeometryEditorProps = Readonly<{
  window: WindowGeometry;
  applicationName: string;
  disabled: boolean;
  onChange: (next: WindowGeometry) => void;
  currentApplicationId: GeometryOverlayPeer["id"];
  applications: ReadonlyArray<
    Pick<ExternalApplicationsPanelApplication, "id" | "name" | "openMode" | "window">
  >;
}>;

/**
 * @uiMeta f=F-032
 */
export function WindowGeometryEditor({
  window: geometry,
  applicationName,
  disabled,
  onChange,
  currentApplicationId,
  applications,
}: WindowGeometryEditorProps): JSX.Element {
  const { t } = useI18n();
  const peers = useMemo(
    () => applications.map((application) => toGeometryOverlayPeer(application)),
    [applications],
  );
  const eligiblePeers = useMemo(
    () => listEligibleOverlayPeers(peers, currentApplicationId),
    [peers, currentApplicationId],
  );
  const overlays = useWindowGeometryOverlaySelection(eligiblePeers);

  function patch(partial: Partial<WindowGeometry>): void {
    onChange({ ...geometry, ...partial });
  }

  return (
    <section
      className={styles.section}
      data-testid="external-applications-window-geometry"
    >
      <h4 className={styles.title}>
        {t("settings.integrations.externalApplications.windowGeometry.title")}
      </h4>
      <div className={styles.layout}>
        <div className={styles.previewColumn}>
          <WindowGeometryPreview
            width={geometry.width}
            height={geometry.height}
            x={geometry.x}
            y={geometry.y}
            applicationName={applicationName}
            disabled={disabled}
            renderOverlayCards={(scale) => (
              <WindowGeometryOverlayCards
                peers={overlays.activePeers}
                scale={scale}
                disabled={disabled}
                onRemove={overlays.remove}
              />
            )}
            overlaysTrigger={
              <WindowGeometryOverlays
                eligiblePeers={eligiblePeers}
                activePeers={overlays.activePeers}
                disabled={disabled}
                onAdd={overlays.add}
                onRemove={overlays.remove}
              />
            }
            onGeometryChange={(next) => {
              onChange(next);
            }}
          />
        </div>
        <div className={styles.controls}>
          <WindowGeometryPresetChips
            width={geometry.width}
            height={geometry.height}
            disabled={disabled}
            onSelect={(size) => {
              patch(size);
            }}
          />
          <div className={styles.controlsFields}>
            <WindowGeometrySizeFields
              width={geometry.width}
              height={geometry.height}
              disabled={disabled}
              onChange={(size) => {
                patch(size);
              }}
            />
            <WindowGeometryPositionFields
              x={geometry.x}
              y={geometry.y}
              disabled={disabled}
              onChange={(position) => {
                patch(position);
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
