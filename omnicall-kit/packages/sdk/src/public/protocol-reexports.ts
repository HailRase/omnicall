/**
 * Integrator-facing re-exports of protocol DTOs used by OmniCallClient.
 * Prefer importing these from `@softomnitel/omnicall-kit` for CRM apps; advanced wire
 * schemas/fixtures remain on `@softomnitel/omnicall-protocol`.
 */

/**
 * Authenticated snapshot after ready / reconnect.
 * @public
 */
export type { SnapshotMessage } from '@softomnitel/omnicall-protocol';

/**
 * Snapshot section bag (`session`, `account`, `calls`, `operator`, …).
 * @public
 */
export type { SnapshotSections } from '@softomnitel/omnicall-protocol';

/**
 * One call row inside `snapshot.sections.calls`.
 * @public
 */
export type { SnapshotCallSummary } from '@softomnitel/omnicall-protocol';

/**
 * Server-granted capability id (fail-closed matrix).
 * @public
 */
export type { CapabilityId } from '@softomnitel/omnicall-protocol';

/**
 * Stable machine-readable error code (`OmniCallClientError.code`).
 * @public
 */
export type { ProtocolErrorCode } from '@softomnitel/omnicall-protocol';

/**
 * Coarse operator status on snapshot / `operator:status-changed`.
 * @public
 */
export type { PublicOperatorStatus } from '@softomnitel/omnicall-protocol';

/**
 * JSON-safe readonly object used for optional error `details`.
 * @public
 */
export type { WireJsonObject } from '@softomnitel/omnicall-protocol';
