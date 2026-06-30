import { describe, expect, it } from "vitest";
import { deriveCallLineStatusLabel } from "./deriveCallLineStatusLabel.js";

describe("deriveCallLineStatusLabel", () => {
  it("maps active state to on line", () => {
    expect(deriveCallLineStatusLabel({ state: "Active" })).toBe("На линии");
  });

  it("maps held state to on hold", () => {
    expect(deriveCallLineStatusLabel({ state: "Held" })).toBe("На удержании");
  });

  it("prefers held state label when both local and remote hold are active", () => {
    expect(deriveCallLineStatusLabel({ state: "Held" })).toBe("На удержании");
  });

  it("keeps active label when only remote hold is active", () => {
    expect(deriveCallLineStatusLabel({ state: "Active" })).toBe("На линии");
  });

  it("maps connecting and ringing states", () => {
    expect(deriveCallLineStatusLabel({ state: "Connecting" })).toBe("Соединение");
    expect(deriveCallLineStatusLabel({ state: "Ringing" })).toBe("Вызов");
  });

  it("maps transfer and terminal states", () => {
    expect(deriveCallLineStatusLabel({ state: "Transferring" })).toBe("Перевод");
    expect(deriveCallLineStatusLabel({ state: "Ending" })).toBe("Завершение");
    expect(deriveCallLineStatusLabel({ state: "Failed" })).toBe("Ошибка");
  });
});
