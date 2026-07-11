/**
 * - Purpose: IPC handlers for listing display sources and setting pending grant (F-027).
 * - Inputs: ipcMain; desktopCapturer + screen metrics via Electron.
 * - Outputs: registered list/set-pending channels with PNG preview data URLs.
 */

import {
  desktopCapturer,
  ipcMain,
  screen,
  type DesktopCapturerSource,
  type IpcMainInvokeEvent,
} from "electron";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseSetPendingDisplaySourcePayload,
  type DisplayCaptureSourceDto,
  type ListDisplaySourcesResponse,
  type SetPendingDisplaySourceResponse,
} from "@shared/ipc/DisplayCaptureContract.js";
import { nativeImageToPreviewDataUrl } from "./nativeImageToPreviewDataUrl.js";
import {
  clearPendingDisplaySourceId,
  setPendingDisplaySourceId,
} from "./pendingDisplaySourceStore.js";

/** Logical CSS preview size; scaled by display factor for sharp thumbnails. */
const THUMBNAIL_LOGICAL = { width: 320, height: 180 } as const;

/**
 * - Purpose: register display-capture IPC for renderer picker.
 * - Inputs: none (uses default ipcMain).
 * - Outputs: handlers registered.
 */
export function registerDisplayCaptureIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.mediaListDisplaySources,
    async (): Promise<ListDisplaySourcesResponse> => {
      try {
        const sources = await listDesktopCapturerSources();
        const mapped: DisplayCaptureSourceDto[] = sources.map(mapDesktopCapturerSource);
        return { ok: true, sources: mapped };
      } catch {
        return { ok: false, reason: "list_sources_failed" };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.mediaSetPendingDisplaySource,
    (
      event: IpcMainInvokeEvent,
      payload: unknown,
    ): SetPendingDisplaySourceResponse => {
      const parsed = parseSetPendingDisplaySourcePayload(payload);
      if (parsed === null) {
        return { ok: false, reason: "invalid_payload" };
      }
      const webContentsId = event.sender.id;
      if (parsed.sourceId === null) {
        clearPendingDisplaySourceId(webContentsId);
        return { ok: true };
      }
      setPendingDisplaySourceId(webContentsId, parsed.sourceId);
      return { ok: true };
    },
  );
}

/**
 * - Purpose: resolve thumbnail capture size from primary display scale factor.
 * - Inputs: none (reads Electron screen).
 * - Outputs: pixel size for desktopCapturer thumbnailSize.
 */
export function resolveDisplayCaptureThumbnailSize(): Readonly<{
  width: number;
  height: number;
}> {
  const scale = screen.getPrimaryDisplay().scaleFactor;
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  return {
    width: Math.round(THUMBNAIL_LOGICAL.width * safeScale),
    height: Math.round(THUMBNAIL_LOGICAL.height * safeScale),
  };
}

/**
 * - Purpose: enumerate screens and windows separately then merge (more complete on Windows).
 * - Inputs: none.
 * - Outputs: deduped DesktopCapturerSource list with populated thumbnails.
 */
export async function listDesktopCapturerSources(): Promise<DesktopCapturerSource[]> {
  const thumbnailSize = resolveDisplayCaptureThumbnailSize();
  const [screenSources, windowSources] = await Promise.all([
    desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize,
      fetchWindowIcons: false,
    }),
    desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize,
      fetchWindowIcons: true,
    }),
  ]);

  const byId = new Map<string, DesktopCapturerSource>();
  for (const source of screenSources) {
    byId.set(source.id, source);
  }
  for (const source of windowSources) {
    byId.set(source.id, source);
  }
  return [...byId.values()];
}

/**
 * - Purpose: map a desktopCapturer source to IPC DTO with PNG preview payloads.
 * - Inputs: DesktopCapturerSource.
 * - Outputs: DisplayCaptureSourceDto.
 */
export function mapDesktopCapturerSource(
  source: DesktopCapturerSource,
): DisplayCaptureSourceDto {
  const thumbnailDataUrl = nativeImageToPreviewDataUrl(source.thumbnail);
  const appIconDataUrl = nativeImageToPreviewDataUrl(source.appIcon);
  return {
    id: source.id,
    name: source.name.trim().length > 0 ? source.name : source.id,
    kind: source.id.startsWith("screen:") ? "screen" : "window",
    thumbnailDataUrl,
    appIconDataUrl,
  };
}
