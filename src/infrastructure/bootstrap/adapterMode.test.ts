import { describe, expect, it } from "vitest";
import { resolveAdapterMode } from "./adapterMode.js";

describe("resolveAdapterMode", () => {
  it("defaults to mock when no input is provided", () => {
    expect(resolveAdapterMode()).toBe("mock");
  });

  it("prefers URL adapters param over env", () => {
    expect(
      resolveAdapterMode({
        urlAdaptersParam: "mock",
        envAdapterMode: "real",
      }),
    ).toBe("mock");
    expect(
      resolveAdapterMode({
        urlAdaptersParam: "real",
        envAdapterMode: "mock",
      }),
    ).toBe("real");
  });

  it("uses env when URL param is absent", () => {
    expect(
      resolveAdapterMode({
        envAdapterMode: "real",
      }),
    ).toBe("real");
  });

  it("falls back to mock for invalid URL and env values", () => {
    expect(
      resolveAdapterMode({
        urlAdaptersParam: "invalid",
        envAdapterMode: "also-invalid",
      }),
    ).toBe("mock");
  });

  it("falls back to env when URL param is invalid", () => {
    expect(
      resolveAdapterMode({
        urlAdaptersParam: "unknown",
        envAdapterMode: "real",
      }),
    ).toBe("real");
  });

  it("falls back to mock when URL param is null and env is invalid", () => {
    expect(
      resolveAdapterMode({
        urlAdaptersParam: null,
        envAdapterMode: "production",
      }),
    ).toBe("mock");
  });
});
