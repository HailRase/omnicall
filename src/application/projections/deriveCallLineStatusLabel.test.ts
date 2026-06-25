import { describe, expect, it } from "vitest";
import { deriveCallLineStatusLabel } from "./deriveCallLineStatusLabel.js";

describe("deriveCallLineStatusLabel", () => {
  it("maps active state to on line", () => {
    expect(deriveCallLineStatusLabel({ state: "Active" })).toBe("На линии");
  });

  it("maps held state to on hold", () => {
    expect(deriveCallLineStatusLabel({ state: "Held" })).toBe("На удержании");
  });

  it("prefers remote hold label over held state", () => {
    expect(deriveCallLineStatusLabel({ state: "Held", isRemoteHold: true })).toBe(
      "На удалённом удержании",
    );
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
