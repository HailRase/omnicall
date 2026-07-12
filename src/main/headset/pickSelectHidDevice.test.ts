import { describe, expect, it } from "vitest";
import {
  parseSoftphoneHidDeviceId,
  pickSelectHidDeviceId,
  type SelectHidDeviceCandidate,
} from "./pickSelectHidDevice.js";

const jabra: SelectHidDeviceCandidate = {
  deviceId: "electron-jabra",
  name: "Jabra Evolve 65",
  vendorId: 0x0b0e,
  productId: 0x0300,
};

const poly: SelectHidDeviceCandidate = {
  deviceId: "electron-poly",
  name: "Poly BW3320",
  vendorId: 0x047f,
  productId: 0x430a,
};

describe("parseSoftphoneHidDeviceId", () => {
  it("parses vendor:product:name", () => {
    expect(parseSoftphoneHidDeviceId("2830:768:Jabra Evolve 65")).toEqual({
      vendorId: 2830,
      productId: 768,
      productName: "Jabra Evolve 65",
    });
  });

  it("rejects malformed ids", () => {
    expect(parseSoftphoneHidDeviceId("")).toBeNull();
    expect(parseSoftphoneHidDeviceId("2830")).toBeNull();
    expect(parseSoftphoneHidDeviceId("2830:768")).toBeNull();
    expect(parseSoftphoneHidDeviceId("x:y:z")).toBeNull();
  });
});

describe("pickSelectHidDeviceId", () => {
  it("returns empty string for empty list", () => {
    expect(pickSelectHidDeviceId([], "2830:768:Jabra Evolve 65")).toBe("");
  });

  it("falls back to first device when preferred missing", () => {
    expect(pickSelectHidDeviceId([jabra, poly], null)).toBe("electron-jabra");
    expect(pickSelectHidDeviceId([jabra, poly], "999:1:Missing")).toBe("electron-jabra");
  });

  it("selects preferred device when present in list", () => {
    expect(
      pickSelectHidDeviceId(
        [jabra, poly],
        `${poly.vendorId}:${poly.productId}:${poly.name}`,
      ),
    ).toBe("electron-poly");
  });
});
