/**
 * - Purpose: hold ephemeral OCP HTTP token for one in-memory attempt only.
 * - Inputs: attempt id + token from OcpProxyAuthenticatePort.
 * - Outputs: token lookup for same-socket auth retry; cleared on terminal/supersede.
 *
 * Never persists tokens; never logs token values.
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";

export class OcpAttemptTokenScope {
  private attemptId: CorrelationId | null = null;
  private token: string | null = null;

  begin(attemptId: CorrelationId, token: string): void {
    this.attemptId = attemptId;
    this.token = token;
  }

  getToken(attemptId: CorrelationId): string | null {
    if (this.attemptId !== attemptId) {
      return null;
    }
    return this.token;
  }

  isActive(attemptId: CorrelationId): boolean {
    return this.attemptId === attemptId && this.token !== null;
  }

  clear(): void {
    this.attemptId = null;
    this.token = null;
  }
}
