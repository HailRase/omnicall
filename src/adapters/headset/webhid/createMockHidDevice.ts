/**
 * - Purpose: minimal HIDDevice fixture for vendor profile unit tests.
 * - Inputs: vendorId, productId, optional productName/collections/opened.
 * - Outputs: HIDDevice with stubbed open/close/sendReport/listeners.
 */
export function createMockHidDevice(options: {
  vendorId: number;
  productId: number;
  productName?: string;
  opened?: boolean;
  collections?: HIDCollectionInfo[];
}): HIDDevice {
  const device: HIDDevice = {
    vendorId: options.vendorId,
    productId: options.productId,
    productName: options.productName ?? "Mock Headset",
    opened: options.opened ?? false,
    collections: options.collections ?? [],
    open: (): Promise<void> => Promise.resolve(),
    close: (): Promise<void> => Promise.resolve(),
    sendReport: (): Promise<void> => Promise.resolve(),
    addEventListener: (): void => undefined,
    removeEventListener: (): void => undefined,
    dispatchEvent: (): boolean => false,
  };
  return device;
}
