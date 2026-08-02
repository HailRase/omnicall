import {
  DEFAULT_DISCOVERY_HOST,
  DEFAULT_DISCOVERY_PORT,
  DISCOVERY_PATH,
  validateDiscoveryDocument,
  type DiscoveryDocument,
} from '@softomnitel/omnicall-protocol';

import { OmniCallClientError } from '../internal/client-errors.js';

/** Caller-provided browser fetch boundary for loopback discovery. @public */
export type OmniCallDiscoveryOptions = Readonly<{
  readonly fetch: (input: string, init: Readonly<{ signal?: AbortSignal }>) => Promise<Response>;
  readonly signal?: AbortSignal;
}>;

/** Discover and validate the trusted default loopback Desktop endpoint. @public */
export async function discoverOmniCallDesktop(
  options: OmniCallDiscoveryOptions,
): Promise<DiscoveryDocument> {
  try {
    const response = await options.fetch(
      `http://${DEFAULT_DISCOVERY_HOST}:${DEFAULT_DISCOVERY_PORT}${DISCOVERY_PATH}`,
      { ...(options.signal !== undefined ? { signal: options.signal } : {}) },
    );
    if (!response.ok || response.redirected) {
      throw new OmniCallClientError({
        code: 'discovery_unreachable',
        retryable: true,
      });
    }
    const parsed = validateDiscoveryDocument(await response.json());
    if (!parsed.success) {
      throw new OmniCallClientError({ code: parsed.code, retryable: false });
    }
    return parsed.data;
  } catch (error: unknown) {
    if (error instanceof OmniCallClientError) {
      throw error;
    }
    throw new OmniCallClientError({
      code: 'discovery_unreachable',
      retryable: true,
    });
  }
}
