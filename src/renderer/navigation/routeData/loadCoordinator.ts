/**
 * - Purpose: deduplicate concurrent list loads across StrictMode remounts.
 * - Inputs: stable load keys and async loader callbacks.
 * - Outputs: shared in-flight promise per key until completion.
 */
const inFlightLoads = new Map<string, Promise<void>>();

export async function runLoadOnce(key: string, loader: () => Promise<void>): Promise<void> {
  const existing = inFlightLoads.get(key);
  if (existing !== undefined) {
    await existing;
    return;
  }

  const promise = loader().finally(() => {
    inFlightLoads.delete(key);
  });
  inFlightLoads.set(key, promise);
  await promise;
}

export function resetLoadCoordinator(): void {
  inFlightLoads.clear();
}

export function clearLoadCoordinatorForTests(): void {
  resetLoadCoordinator();
}
