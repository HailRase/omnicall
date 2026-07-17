import type { CorrelationId } from "@shared/correlation-id/index.js";

const DEFAULT_ATTEMPT_SECRET_TTL_MS = 5 * 60 * 1_000;

type AttemptSecrets = Readonly<{
  expiresAt: number;
  sipPassword?: string;
  ocpApiKey?: string;
}>;

export class AttemptScopedSecretScope {
  private readonly secrets = new Map<CorrelationId, AttemptSecrets>();

  constructor(
    private readonly ttlMs = DEFAULT_ATTEMPT_SECRET_TTL_MS,
    private readonly now: () => number = Date.now,
  ) {}

  store(
    attemptId: CorrelationId,
    values: Readonly<{ sipPassword?: string; ocpApiKey?: string }>,
  ): void {
    this.pruneExpired();
    this.secrets.set(attemptId, {
      expiresAt: this.now() + this.ttlMs,
      ...(values.sipPassword !== undefined
        ? { sipPassword: values.sipPassword }
        : {}),
      ...(values.ocpApiKey !== undefined ? { ocpApiKey: values.ocpApiKey } : {}),
    });
  }

  read(attemptId: CorrelationId): Readonly<{
    sipPassword?: string;
    ocpApiKey?: string;
  }> | null {
    this.pruneExpired();
    const value = this.secrets.get(attemptId);
    if (value === undefined) {
      return null;
    }
    return {
      ...(value.sipPassword !== undefined
        ? { sipPassword: value.sipPassword }
        : {}),
      ...(value.ocpApiKey !== undefined ? { ocpApiKey: value.ocpApiKey } : {}),
    };
  }

  clear(attemptId?: CorrelationId): void {
    if (attemptId === undefined) {
      this.secrets.clear();
      return;
    }
    this.secrets.delete(attemptId);
  }

  private pruneExpired(): void {
    const now = this.now();
    for (const [attemptId, value] of this.secrets) {
      if (value.expiresAt <= now) {
        this.secrets.delete(attemptId);
      }
    }
  }
}
