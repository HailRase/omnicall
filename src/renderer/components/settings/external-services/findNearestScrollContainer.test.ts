// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { findNearestScrollContainer } from "./findNearestScrollContainer.js";

afterEach(() => {
  document.body.replaceChildren();
});

describe("findNearestScrollContainer", () => {
  it("skips overflow:hidden and returns the scroll ancestor", () => {
    const scroll = document.createElement("div");
    scroll.style.overflow = "auto";
    const hidden = document.createElement("div");
    hidden.style.overflow = "hidden";
    const start = document.createElement("button");
    hidden.append(start);
    scroll.append(hidden);
    document.body.append(scroll);

    expect(findNearestScrollContainer(start)).toBe(scroll);
  });

  it("returns null when only overflow:hidden ancestors exist", () => {
    const hidden = document.createElement("div");
    hidden.style.overflow = "hidden";
    const start = document.createElement("span");
    hidden.append(start);
    document.body.append(hidden);

    expect(findNearestScrollContainer(start)).toBeNull();
  });
});
