import type { JSX } from "react";
import clsx from "clsx";
import type { DisplayCaptureSourceDto } from "@shared/ipc/DisplayCaptureContract.js";
import { Button } from "../ui/button/index.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog/index.js";
import type { TranslationKey } from "../../i18n/index.js";
import { useI18n } from "../../i18n/index.js";
import type { ScreenSharePickerSourceKind } from "../../hooks/useScreenSharePicker.js";
import styles from "./ScreenSharePickerDialog.module.css";

export type ScreenSharePickerDialogProps = Readonly<{
  open: boolean;
  loading: boolean;
  confirming: boolean;
  errorKey: TranslationKey | null;
  activeKind: ScreenSharePickerSourceKind;
  selectedSourceId: string | null;
  sources: ReadonlyArray<DisplayCaptureSourceDto>;
  onActiveKindChange: (kind: ScreenSharePickerSourceKind) => void;
  onSelectSource: (sourceId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}>;

/**
 * - Purpose: present screen/window capture choices before starting share (F-027).
 * - Inputs: picker state and callbacks from useScreenSharePicker.
 * - Outputs: accessible Dialog with tabs, thumbnails, confirm/cancel.
 */
export function ScreenSharePickerDialog({
  open,
  loading,
  confirming,
  errorKey,
  activeKind,
  selectedSourceId,
  sources,
  onActiveKindChange,
  onSelectSource,
  onConfirm,
  onCancel,
}: ScreenSharePickerDialogProps): JSX.Element {
  const { t } = useI18n();
  const confirmDisabled =
    loading || confirming || selectedSourceId === null || sources.length === 0;
  const tabPanelId = "screen-share-picker-panel";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
    >
      <DialogContent
        size="fullscreen"
        className={styles.content}
        showCloseButton={false}
        closeLabel={t("common.close")}
        data-testid="screen-share-picker-dialog"
        onEscapeKeyDown={(event) => {
          event.preventDefault();
        }}
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          event.preventDefault();
        }}
      >
        <div className={styles.layout}>
          <DialogHeader className={styles.header}>
            <DialogTitle>{t("call.video.screenShare.picker.title")}</DialogTitle>
            <DialogDescription>
              {t("call.video.screenShare.picker.description")}
            </DialogDescription>
          </DialogHeader>

          <div
            className={styles.tabs}
            role="tablist"
            aria-label={t("call.video.screenShare.picker.tabsAria")}
          >
            <button
              type="button"
              role="tab"
              aria-controls={tabPanelId}
              aria-selected={activeKind === "screen"}
              tabIndex={activeKind === "screen" ? 0 : -1}
              className={clsx(styles.tab, activeKind === "screen" && styles.tabActive)}
              data-testid="screen-share-picker-tab-screen"
              onClick={() => {
                onActiveKindChange("screen");
              }}
            >
              {t("call.video.screenShare.picker.tabScreen")}
            </button>
            <button
              type="button"
              role="tab"
              aria-controls={tabPanelId}
              aria-selected={activeKind === "window"}
              tabIndex={activeKind === "window" ? 0 : -1}
              className={clsx(styles.tab, activeKind === "window" && styles.tabActive)}
              data-testid="screen-share-picker-tab-window"
              onClick={() => {
                onActiveKindChange("window");
              }}
            >
              {t("call.video.screenShare.picker.tabWindow")}
            </button>
            <button
              type="button"
              role="tab"
              aria-controls={tabPanelId}
              aria-selected={activeKind === "chromeTab"}
              tabIndex={activeKind === "chromeTab" ? 0 : -1}
              className={clsx(styles.tab, activeKind === "chromeTab" && styles.tabActive)}
              data-testid="screen-share-picker-tab-chrome-tab"
              onClick={() => {
                onActiveKindChange("chromeTab");
              }}
            >
              {t("call.video.screenShare.picker.tabChrome")}
            </button>
          </div>

          <div
            id={tabPanelId}
            className={styles.grid}
            role="tabpanel"
            data-testid="screen-share-picker-grid"
          >
            {loading ? (
              <p className={styles.status}>{t("call.video.screenShare.picker.loading")}</p>
            ) : null}
            {!loading && sources.length === 0 ? (
              <p className={styles.status}>{t("call.video.screenShare.picker.empty")}</p>
            ) : null}
            {!loading
              ? sources.map((source) => {
                  const selected = source.id === selectedSourceId;
                  return (
                    <button
                      key={source.id}
                      type="button"
                      className={clsx(styles.card, selected && styles.cardSelected)}
                      data-testid={`screen-share-picker-source-${source.id}`}
                      aria-pressed={selected}
                      onClick={() => {
                        onSelectSource(source.id);
                      }}
                    >
                      {source.thumbnailDataUrl !== null ? (
                        <img
                          className={styles.thumb}
                          src={source.thumbnailDataUrl}
                          alt=""
                        />
                      ) : source.appIconDataUrl !== null ? (
                        <img
                          className={clsx(styles.thumb, styles.thumbIcon)}
                          src={source.appIconDataUrl}
                          alt=""
                        />
                      ) : (
                        <div className={styles.thumbPlaceholder} aria-hidden />
                      )}
                      <span className={styles.cardLabel}>
                        <span className={styles.cardLabelText}>{source.name}</span>
                      </span>
                    </button>
                  );
                })
              : null}
          </div>

          {errorKey !== null ? (
            <p className={styles.error} role="alert" data-testid="screen-share-picker-error">
              {t(errorKey)}
            </p>
          ) : null}

          <DialogFooter className={styles.footer}>
            <Button
              type="button"
              variant="secondary"
              data-testid="screen-share-picker-cancel"
              onClick={onCancel}
              disabled={confirming}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              data-testid="screen-share-picker-confirm"
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              {confirming
                ? t("call.video.screenShare.picker.confirming")
                : t("call.video.screenShare.picker.confirm")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
