export {};

declare global {
  interface Navigator {
    readonly hid: HID;
  }

  interface HID {
    requestDevice(options?: HIDDeviceRequestOptions): Promise<HIDDevice[]>;
    getDevices(): Promise<HIDDevice[]>;
    addEventListener(
      type: "connect" | "disconnect",
      listener: (event: HIDConnectionEvent) => void,
    ): void;
    removeEventListener(
      type: "connect" | "disconnect",
      listener: (event: HIDConnectionEvent) => void,
    ): void;
  }

  interface HIDDeviceRequestOptions {
    filters: HIDDeviceFilter[];
  }

  interface HIDDeviceFilter {
    vendorId?: number;
    productId?: number;
    usagePage?: number;
    usage?: number;
  }

  interface HIDDevice extends EventTarget {
    readonly opened: boolean;
    readonly vendorId: number;
    readonly productId: number;
    readonly productName: string;
    readonly collections: HIDCollectionInfo[];
    open(): Promise<void>;
    close(): Promise<void>;
    sendReport(reportId: number, data: BufferSource): Promise<void>;
    addEventListener(
      type: "inputreport",
      listener: (event: HIDInputReportEvent) => void,
    ): void;
    removeEventListener(
      type: "inputreport",
      listener: (event: HIDInputReportEvent) => void,
    ): void;
  }

  interface HIDCollectionInfo {
    readonly usagePage: number;
    readonly usage: number;
    readonly children: HIDCollectionInfo[];
    readonly inputReports: HIDReportInfo[];
    readonly outputReports: HIDReportInfo[];
  }

  interface HIDReportInfo {
    readonly reportId?: number;
  }

  interface HIDInputReportEvent extends Event {
    readonly device: HIDDevice;
    readonly reportId: number;
    readonly data: DataView;
  }

  interface HIDConnectionEvent extends Event {
    readonly device: HIDDevice;
  }
}
