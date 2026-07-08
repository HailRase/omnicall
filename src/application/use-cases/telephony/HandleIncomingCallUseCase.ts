import type { Call } from "@domain/index.js";
import type { TelephonyIncomingCallNotification } from "@ports/index.js";
import type { Result } from "@shared/result/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { CallEngine } from "@application/services/telephony/CallEngine.js";

export type HandleIncomingCallInput = Readonly<{
  notification: TelephonyIncomingCallNotification;
}>;

export class HandleIncomingCallUseCase {
  constructor(private readonly callEngine: CallEngine) {}

  execute(
    input: HandleIncomingCallInput,
  ): Promise<Result<Call, ReturnType<typeof createPlatformError>>> {
    return this.callEngine.handleIncomingReceived(input);
  }
}
