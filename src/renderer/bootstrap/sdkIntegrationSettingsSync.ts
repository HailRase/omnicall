/**
 * Notify Settings SDK panel when Origin matrix / trust changes outside the panel
 * (e.g. activate-consent Deny → account.activate disabled).
 */

type Listener = () => void;

const listeners = new Set<Listener>();

export function notifySdkIntegrationSettingsChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeSdkIntegrationSettingsChanged(
  listener: Listener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
