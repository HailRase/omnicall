/**
 * - Purpose: enable renderer getDisplayMedia via pending desktopCapturer source (F-027).
 * - Inputs: session to configure; optional logger.
 * - Outputs: display-media request handler installed; void.
 */

import { desktopCapturer, webContents, type Session } from "electron";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { takePendingDisplaySourceId } from "./pendingDisplaySourceStore.js";

export type InstallDisplayMediaRequestHandlerOptions = Readonly<{
  session: Session;
  logger?: Logger;
}>;

/**
 * - Purpose: grant only a user-selected pending display source for getDisplayMedia.
 * - Inputs: Electron session (+ optional logger).
 * - Outputs: handler registered; denies when no pending source.
 */
export function installDisplayMediaRequestHandler(
  options: InstallDisplayMediaRequestHandlerOptions,
): void {
  const { session: electronSession, logger } = options;

  electronSession.setDisplayMediaRequestHandler((request, callback) => {
    const contents =
      request.frame !== undefined && request.frame !== null
        ? webContents.fromFrame(request.frame)
        : null;
    const webContentsId = contents?.id ?? null;

    if (webContentsId === null) {
      logger?.warn("display_media_missing_web_contents", {
        correlationId: createCorrelationId(),
        featureId: "F-027",
        boundedContext: "Media",
        operation: "display_media_request",
        result: "denied",
      });
      callback({});
      return;
    }

    const pendingSourceId = takePendingDisplaySourceId(webContentsId);
    if (pendingSourceId === null) {
      logger?.warn("display_media_no_pending_source", {
        correlationId: createCorrelationId(),
        featureId: "F-027",
        boundedContext: "Media",
        operation: "display_media_request",
        result: "denied",
      });
      callback({});
      return;
    }

    void desktopCapturer
      .getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 0, height: 0 },
      })
      .then((sources) => {
        const matched = sources.find((source) => source.id === pendingSourceId);
        if (matched === undefined) {
          logger?.warn("display_media_pending_source_missing", {
            correlationId: createCorrelationId(),
            featureId: "F-027",
            boundedContext: "Media",
            operation: "display_media_request",
            result: "denied",
            sourceId: pendingSourceId,
          });
          callback({});
          return;
        }

        logger?.info("display_media_source_granted", {
          correlationId: createCorrelationId(),
          featureId: "F-027",
          boundedContext: "Media",
          operation: "display_media_request",
          result: "succeeded",
          sourceId: matched.id,
        });
        callback({ video: matched });
      })
      .catch((error: unknown) => {
        logger?.error(
          "display_media_sources_failed",
          {
            correlationId: createCorrelationId(),
            featureId: "F-027",
            boundedContext: "Media",
            operation: "display_media_request",
            result: "failed",
          },
          error,
        );
        callback({});
      });
  }, { useSystemPicker: false });
}
