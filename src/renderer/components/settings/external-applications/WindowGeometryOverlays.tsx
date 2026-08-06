/**
 * - Purpose: Layers trigger + checkbox menu for peer overlays on geometry preview.
 * - Inputs: eligible peers, active peers, disabled, add/remove callbacks.
 * - Outputs: icon-only control; menu toggles which peers render on the desktop.
 */

import { useState, type JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { AppIcon } from "../../icons/AppIcon.js";
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../../ui/index.js";
import type { GeometryOverlayPeer } from "./windowGeometryOverlayTypes.js";
import styles from "./WindowGeometryOverlays.module.css";

export type WindowGeometryOverlaysProps = Readonly<{
  eligiblePeers: ReadonlyArray<GeometryOverlayPeer>;
  activePeers: ReadonlyArray<GeometryOverlayPeer>;
  disabled: boolean;
  onAdd: (id: GeometryOverlayPeer["id"]) => void;
  onRemove: (id: GeometryOverlayPeer["id"]) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function WindowGeometryOverlays({
  eligiblePeers,
  activePeers,
  disabled,
  onAdd,
  onRemove,
}: WindowGeometryOverlaysProps): JSX.Element {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const emptyNoPeers = eligiblePeers.length === 0;
  const triggerDisabled = disabled || emptyNoPeers;
  const title = t("settings.integrations.externalApplications.windowGeometry.overlays.title");
  const emptyLabel = t(
    "settings.integrations.externalApplications.windowGeometry.overlays.empty",
  );
  const activeIdSet = new Set(activePeers.map((peer) => peer.id));
  const tooltipLabel = emptyNoPeers ? emptyLabel : title;

  return (
    <div
      className={styles.triggerHost}
      data-testid="external-applications-geometry-overlays"
    >
      <DropdownMenu
        open={open}
        onOpenChange={(nextOpen) => {
          if (triggerDisabled) {
            setOpen(false);
            return;
          }
          setOpen(nextOpen);
        }}
      >
        <DropdownMenuTrigger asChild disabled={triggerDisabled}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={styles.trigger}
            disabled={triggerDisabled}
            aria-label={tooltipLabel}
            title={tooltipLabel}
            aria-expanded={open}
            data-testid="external-applications-geometry-overlays-trigger"
            data-active={activePeers.length > 0 ? "true" : "false"}
          >
            <AppIcon
              id="settings.integrations.external-applications.overlays"
              decorative
              preferAnimated
              size={16}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={6}
          className={styles.menu}
          aria-label={title}
        >
          <DropdownMenuLabel>{title}</DropdownMenuLabel>
          {eligiblePeers.map((peer) => {
            const checked = activeIdSet.has(peer.id);
            return (
              <DropdownMenuCheckboxItem
                key={peer.id}
                checked={checked}
                disabled={disabled}
                data-testid={`external-applications-geometry-overlay-option-${peer.id}`}
                onSelect={(event) => {
                  event.preventDefault();
                }}
                onCheckedChange={(nextChecked) => {
                  if (nextChecked === true) {
                    onAdd(peer.id);
                    return;
                  }
                  onRemove(peer.id);
                }}
              >
                {peer.name}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
