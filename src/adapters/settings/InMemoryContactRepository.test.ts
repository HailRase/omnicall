import { describe, expect, it } from "vitest";
import { InMemoryContactRepository } from "./InMemoryContactRepository.js";

const sampleInput = {
  displayName: "Zoe Agent",
  primaryPhone: "+12025550111",
} as const;

describe("InMemoryContactRepository", () => {
  it("lists contacts sorted by display name", async () => {
    const repository = new InMemoryContactRepository();
    await repository.createContact({ displayName: "Bravo", primaryPhone: "101" });
    await repository.createContact({ displayName: "Alpha", primaryPhone: "102" });

    const listed = await repository.listContacts();
    expect(listed.map((contact) => contact.displayName)).toEqual(["Alpha", "Bravo"]);
  });

  it("updates and deletes contacts", async () => {
    const repository = new InMemoryContactRepository();
    const created = await repository.createContact(sampleInput);

    const updated = await repository.updateContact(created.id, {
      displayName: "Zoe Updated",
    });
    expect(updated?.displayName).toBe("Zoe Updated");

    const deleted = await repository.deleteContact(created.id);
    expect(deleted).toBe(true);
    expect(await repository.getContactById(created.id)).toBeNull();
  });
});
