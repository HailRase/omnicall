// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserAvatar } from "./UserAvatar.js";

afterEach(() => {
  cleanup();
});

describe("UserAvatar", () => {
  it("renders initials in a non-interactive span by default", () => {
    render(<UserAvatar initials="AB" />);

    expect(screen.getByTestId("user-avatar")).toHaveTextContent("AB");
    expect(screen.getByTestId("user-avatar").tagName).toBe("SPAN");
  });

  it("renders button when onClick is provided", () => {
    const onClick = vi.fn();
    render(<UserAvatar initials="XY" onClick={onClick} />);

    const avatar = screen.getByTestId("user-avatar");
    expect(avatar.tagName).toBe("BUTTON");
    avatar.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
