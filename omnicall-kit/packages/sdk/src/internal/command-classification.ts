/**
 * Client-side classification for reconnect safety.
 * Non-idempotent mutations must never be silently replayed.
 */

import type { CommandType } from '@softomnitel/omnicall-protocol';

const IDEMPOTENT_COMMANDS: ReadonlySet<CommandType> = new Set([
  'sdk:get-snapshot',
  'sdk:ping',
  'window:get-state',
  'operator:get-reasons'
]);

export function isMutationCommand(commandType: CommandType): boolean {
  return !IDEMPOTENT_COMMANDS.has(commandType);
}
