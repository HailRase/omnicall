/**
 * - Purpose: register typed main IPC for External Services outbound HTTP.
 * - Inputs: renderer invoke payloads for one bounded request.
 * - Outputs: validated transport DTOs and a disposer that aborts in-flight work.
 */

import { ipcMain } from "electron";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  EXTERNAL_SERVICES_HTTP_TIMEOUT_MS,
  parseExternalServicesHttpRequestDto,
  type ExternalServicesHttpResponseDto,
} from "@shared/ipc/ExternalServicesHttpContract.js";
import { executeExternalServicesHttpRequest } from "./executeExternalServicesHttpRequest.js";

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-031",
});

export type ExternalServicesHttpIpcRegistration = Readonly<{
  dispose: () => void;
}>;

export function registerExternalServicesHttpIpc(): ExternalServicesHttpIpcRegistration {
  const controllers = new Set<AbortController>();

  ipcMain.removeHandler(IPC_CHANNELS.externalServicesHttpExecute);
  ipcMain.handle(
    IPC_CHANNELS.externalServicesHttpExecute,
    async (_event, payload: unknown): Promise<ExternalServicesHttpResponseDto> => {
      const parsed = parseExternalServicesHttpRequestDto(payload);
      if (parsed === null) {
        logger.error("external_services_http_ipc_rejected", {
          operation: "external_services_http_execute",
          result: "invalid_payload",
        });
        return {
          kind: "network_error",
          code: "unknown",
          durationMs: 0,
          message: "Invalid External Services HTTP payload.",
        };
      }

      const controller = new AbortController();
      controllers.add(controller);
      const timer = setTimeout(() => {
        controller.abort("timeout");
      }, EXTERNAL_SERVICES_HTTP_TIMEOUT_MS);

      try {
        return await executeExternalServicesHttpRequest(parsed, controller.signal);
      } finally {
        clearTimeout(timer);
        controllers.delete(controller);
      }
    },
  );

  return {
    dispose: () => {
      ipcMain.removeHandler(IPC_CHANNELS.externalServicesHttpExecute);
      for (const controller of controllers) {
        controller.abort("shutdown");
      }
      controllers.clear();
    },
  };
}
