/**
 * - Purpose: apply SIP account from OCP `creds` after OCP connect (always on).
 * - Inputs: OCP gateway creds entity + SIP registration guard.
 * - Outputs: AuthorizeSipAccount + RegisterAccount orchestration (no password logs).
 */

import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { Logger } from "@ports/index.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { AuthorizeSipAccountUseCase } from "../../use-cases/settings/AuthorizeSipAccountUseCase.js";
import type { RegisterAccountUseCase } from "../../use-cases/settings/RegisterAccountUseCase.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";

export type OcpSipCredentialServiceDeps = Readonly<{
  ocpGateway: OcpGateway;
  logger: Logger;
  authorizeSipAccount: AuthorizeSipAccountUseCase;
  registerAccount: RegisterAccountUseCase;
  isSipRegistered: () => boolean;
}>;

/**
 * Observes OCP `creds` and authorizes + registers SIP when not already registered.
 */
export class OcpSipCredentialService {
  private unsubscribe: (() => void) | null = null;
  private applying = false;

  constructor(private readonly deps: OcpSipCredentialServiceDeps) {
    this.unsubscribe = deps.ocpGateway.onMessage((message) => {
      void this.handleMessage(message);
    });
  }

  dispose(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private async handleMessage(message: OcpIncomingMessage): Promise<void> {
    if (message.entity !== "creds") {
      return;
    }

    const { username, domain } = message.data;

    if (this.deps.isSipRegistered()) {
      this.deps.logger.debug("ocp_sip_credentials_skipped_already_registered", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_sip_credentials",
        domain,
        username,
        result: "skipped_sip_already_registered",
      });
      return;
    }

    if (this.applying) {
      this.deps.logger.debug("ocp_sip_credentials_skipped_in_flight", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_sip_credentials",
        domain,
        username,
        result: "skipped_in_flight",
      });
      return;
    }

    this.applying = true;
    try {
      this.deps.logger.info("ocp_sip_credentials_received", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_sip_credentials",
        domain,
        username,
        result: "applying",
      });

      const authorizeResult = await this.deps.authorizeSipAccount.execute({
        account: {
          username: message.data.username,
          password: message.data.password,
          domain: message.data.domain,
          server: message.data.server,
        },
        source: "ocp",
      });

      if (!authorizeResult.ok) {
        this.deps.logger.error("ocp_sip_authorize_failed", {
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_sip_credentials",
          domain,
          username,
          result: authorizeResult.error.code,
        });
        return;
      }

      const registerResult = await this.deps.registerAccount.execute({
        account: authorizeResult.value,
      });

      if (!registerResult.ok) {
        this.deps.logger.error("ocp_sip_register_failed", {
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_sip_credentials",
          domain,
          username,
          result: registerResult.error.code,
        });
        return;
      }

      this.deps.logger.info("ocp_sip_credentials_applied", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_sip_credentials",
        domain,
        username,
        result: "succeeded",
      });
    } catch (error: unknown) {
      const messageText =
        error instanceof Error ? error.message : "unknown_error";
      this.deps.logger.error("ocp_sip_credentials_apply_threw", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_sip_credentials",
        domain,
        username,
        result: messageText,
      });
    } finally {
      this.applying = false;
    }
  }
}
