const APP_TO_DEVICE_GUARD_MS = 300;
const DEVICE_TO_APP_GUARD_MS = 300;

/**
 * - Purpose: prevent app-device sync echo loops in headset orchestrator.
 * - Inputs: mark calls from orchestrator reconcile or device event handling.
 * - Outputs: guard window queries for bidirectional sync suppression.
 */
export class HeadsetOrchestratorGuards {
  private appToDeviceUntil = 0;
  private deviceToAppUntil = 0;

  markAppToDeviceSync(): void {
    this.appToDeviceUntil = Date.now() + APP_TO_DEVICE_GUARD_MS;
  }

  markDeviceToAppSync(): void {
    this.deviceToAppUntil = Date.now() + DEVICE_TO_APP_GUARD_MS;
  }

  isAppToDeviceGuardActive(): boolean {
    return Date.now() < this.appToDeviceUntil;
  }

  isDeviceToAppGuardActive(): boolean {
    return Date.now() < this.deviceToAppUntil;
  }
}
