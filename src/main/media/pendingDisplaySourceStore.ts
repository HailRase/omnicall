/**
 * - Purpose: session-scoped pending display source id for getDisplayMedia grants.
 * - Inputs: webContents id and optional source id.
 * - Outputs: pending id snapshot for display-media handler.
 */

const pendingSourceIdByWebContentsId = new Map<number, string>();

/**
 * - Purpose: store or clear pending display source for a renderer webContents.
 * - Inputs: webContents id; source id or null to clear.
 * - Outputs: void.
 */
export function setPendingDisplaySourceId(
  webContentsId: number,
  sourceId: string | null,
): void {
  if (sourceId === null) {
    pendingSourceIdByWebContentsId.delete(webContentsId);
    return;
  }
  pendingSourceIdByWebContentsId.set(webContentsId, sourceId);
}

/**
 * - Purpose: read and clear pending display source id for a webContents.
 * - Inputs: webContents id.
 * - Outputs: source id or null when none pending.
 */
export function takePendingDisplaySourceId(webContentsId: number): string | null {
  const sourceId = pendingSourceIdByWebContentsId.get(webContentsId) ?? null;
  pendingSourceIdByWebContentsId.delete(webContentsId);
  return sourceId;
}

/**
 * - Purpose: clear pending display source without consuming for capture.
 * - Inputs: webContents id.
 * - Outputs: void.
 */
export function clearPendingDisplaySourceId(webContentsId: number): void {
  pendingSourceIdByWebContentsId.delete(webContentsId);
}
