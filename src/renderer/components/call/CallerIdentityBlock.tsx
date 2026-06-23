import type { JSX } from "react";

export type CallerIdentityBlockProps = Readonly<{
  callerNumber: string | null;
  displayName: string | null;
  queueInfo: string | null;
}>;

export function CallerIdentityBlock({
  callerNumber,
  displayName,
  queueInfo,
}: CallerIdentityBlockProps): JSX.Element {
  return (
    <section data-testid="caller-identity">
      <p>
        <strong>Caller:</strong> {callerNumber ?? "Unknown"}
      </p>
      <p>
        <strong>Name:</strong> {displayName ?? "Unavailable"}
      </p>
      <p>
        <strong>Queue:</strong> {queueInfo ?? "Pending"}
      </p>
    </section>
  );
}
