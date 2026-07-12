import { describe, expect, it } from "vitest";
import {
  parseListDisplaySourcesResponse,
  parseSetPendingDisplaySourcePayload,
  parseSetPendingDisplaySourceResponse,
} from "./DisplayCaptureContract.js";

describe("DisplayCaptureContract", () => {
  it("parses set-pending payload with source id or null", () => {
    expect(parseSetPendingDisplaySourcePayload({ sourceId: "screen:0:0" })).toEqual({
      sourceId: "screen:0:0",
    });
    expect(parseSetPendingDisplaySourcePayload({ sourceId: null })).toEqual({
      sourceId: null,
    });
    expect(parseSetPendingDisplaySourcePayload({ sourceId: "  " })).toBeNull();
    expect(parseSetPendingDisplaySourcePayload({})).toBeNull();
    expect(parseSetPendingDisplaySourcePayload(null)).toBeNull();
  });

  it("parses list-display-sources success and failure responses", () => {
    expect(
      parseListDisplaySourcesResponse({
        ok: true,
        sources: [
          {
            id: "screen:0:0",
            name: "Screen",
            kind: "screen",
            thumbnailDataUrl: null,
            appIconDataUrl: null,
          },
        ],
      }),
    ).toEqual({
      ok: true,
      sources: [
        {
          id: "screen:0:0",
          name: "Screen",
          kind: "screen",
          thumbnailDataUrl: null,
          appIconDataUrl: null,
        },
      ],
    });
    expect(parseListDisplaySourcesResponse({ ok: false, reason: "list_sources_failed" })).toEqual({
      ok: false,
      reason: "list_sources_failed",
    });
    expect(
      parseListDisplaySourcesResponse({
        ok: true,
        sources: [{ id: "", name: "x", kind: "screen", thumbnailDataUrl: null }],
      }),
    ).toBeNull();
  });

  it("accepts appIconDataUrl as optional preview fallback", () => {
    expect(
      parseListDisplaySourcesResponse({
        ok: true,
        sources: [
          {
            id: "window:1:0",
            name: "App",
            kind: "window",
            thumbnailDataUrl: null,
            appIconDataUrl: "data:image/png;base64,abc",
          },
        ],
      }),
    ).toEqual({
      ok: true,
      sources: [
        {
          id: "window:1:0",
          name: "App",
          kind: "window",
          thumbnailDataUrl: null,
          appIconDataUrl: "data:image/png;base64,abc",
        },
      ],
    });
  });

  it("parses set-pending response", () => {
    expect(parseSetPendingDisplaySourceResponse({ ok: true })).toEqual({ ok: true });
    expect(parseSetPendingDisplaySourceResponse({ ok: false, reason: "invalid_payload" })).toEqual({
      ok: false,
      reason: "invalid_payload",
    });
    expect(parseSetPendingDisplaySourceResponse({ ok: "yes" })).toBeNull();
  });
});
