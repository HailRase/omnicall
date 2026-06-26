// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CallIdleEmptyState } from "./CallIdleEmptyState.js";

describe("CallIdleEmptyState", () => {
  it("renders idle guidance copy", () => {
    render(<CallIdleEmptyState />);
    expect(screen.getByTestId("call-idle-empty-state")).toBeInTheDocument();
    expect(screen.getByText(/Введите номер или дождитесь входящего звонка/)).toBeInTheDocument();
  });
});
