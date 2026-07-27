/**
 * Integrator-facing re-exports of protocol DTOs used by AxatalkClient.
 * Prefer importing these from `@axata/axatalk-sdk` for CRM apps; advanced wire
 * schemas/fixtures remain on `@axata/axatalk-protocol`.
 */

/**
 * Authenticated snapshot after ready / reconnect.
 * @public
 */
export type { SnapshotMessage } from '@axata/axatalk-protocol';

/**
 * Snapshot section bag (`session`, `account`, `calls`, `operator`, …).
 * @public
 */
export type { SnapshotSections } from '@axata/axatalk-protocol';

/**
 * One call row inside `snapshot.sections.calls`.
 * @public
 */
export type { SnapshotCallSummary } from '@axata/axatalk-protocol';

/**
 * Server-granted capability id (fail-closed matrix).
 * @public
 */
export type { CapabilityId } from '@axata/axatalk-protocol';

/**
 * Stable machine-readable error code (`AxatalkClientError.code`).
 * @public
 */
export type { ProtocolErrorCode } from '@axata/axatalk-protocol';

/**
 * Coarse operator status on snapshot / `operator:status-changed`.
 * @public
 */
export type { PublicOperatorStatus } from '@axata/axatalk-protocol';

/**
 * JSON-safe readonly object used for optional error `details`.
 * @public
 */
export type { WireJsonObject } from '@axata/axatalk-protocol';
