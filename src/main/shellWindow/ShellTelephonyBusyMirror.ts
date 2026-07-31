/**
 * Main-side mirror of renderer telephony busy (ringing / connecting / established).
 * Used only for SDK window:hide deny (ADR-0013). No Call Engine imports.
 */

export type ShellTelephonyBusyState = Readonly<{
  busy: boolean;
}>;

export class ShellTelephonyBusyMirror {
  private busy = false;

  setBusy(busy: boolean): void {
    this.busy = busy;
  }

  isBusy(): boolean {
    return this.busy;
  }
}
