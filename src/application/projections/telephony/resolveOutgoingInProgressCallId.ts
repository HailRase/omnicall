/**
 * - Purpose: resolve the in-progress outbound call id for UI/headset selection.
 * - Inputs: multi-line call ids/states and optional waiting incoming call id.
 * - Outputs: Connecting or outbound Ringing call id, else null.
 */
export function resolveOutgoingInProgressCallId(input: Readonly<{
  lines: ReadonlyArray<Readonly<{ callId: string; state: string }>>;
  incomingCallId: string | null;
}>): string | null {
  const connecting = input.lines.find((line) => line.state === "Connecting");
  if (connecting !== undefined) {
    return connecting.callId;
  }

  const outboundRinging = input.lines.find((line) => {
    if (line.state !== "Ringing") {
      return false;
    }
    return input.incomingCallId === null || line.callId !== input.incomingCallId;
  });
  return outboundRinging?.callId ?? null;
}
