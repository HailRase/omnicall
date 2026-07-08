import { describe, expect, it } from "vitest";
import type { Contact } from "@domain/index.js";
import { generateContactId } from "@domain/index.js";
import {
  CONTACT_CSV_CANONICAL_HEADER,
  mapContactCsvRowToInput,
  parseContactsCsv,
  serializeContactsCsv,
} from "./ContactCsvCodec.js";

const sampleContact: Contact = {
  id: generateContactId(),
  displayName: "Alex Agent",
  primaryPhone: "+12025550100",
  secondaryPhone: "+12025550101",
  company: "Axatalk",
  notes: "VIP",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("ContactCsvCodec", () => {
  it("serializes canonical header and escapes commas, quotes, and newlines", () => {
    const csv = serializeContactsCsv([
      sampleContact,
      {
        ...sampleContact,
        id: generateContactId(),
        displayName: 'Name, "Quoted"',
        notes: "Line one\nLine two",
      },
    ]);

    expect(csv.startsWith(`${CONTACT_CSV_CANONICAL_HEADER}\n`)).toBe(true);
    expect(csv).toContain('"Name, ""Quoted"""');
    expect(csv).toContain('"Line one\nLine two"');
  });

  it("parses quoted fields and case-insensitive headers", () => {
    const csv = [
      " DisplayName , PRIMARYPHONE , SecondaryPhone , Company , Notes ",
      '"Alex Agent",+12025550100,,Axatalk,',
      '"Quoted, Name",+12025550102,,,"Note ""VIP"""',
    ].join("\n");

    const parsed = parseContactsCsv(csv);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.value.rows).toHaveLength(2);
    expect(parsed.value.rows[0]?.values.displayName).toBe("Alex Agent");
    expect(parsed.value.rows[1]?.values.displayName).toBe("Quoted, Name");
    expect(parsed.value.rows[1]?.values.notes).toBe('Note "VIP"');
  });

  it("rejects invalid quotes and missing headers", () => {
    expect(parseContactsCsv('"unclosed').ok).toBe(false);
    expect(parseContactsCsv("name,phone\nAlex,+1202").ok).toBe(false);
    expect(
      parseContactsCsv(`${CONTACT_CSV_CANONICAL_HEADER}\nAlex,+12025550100,,,`).ok,
    ).toBe(true);
  });

  it("maps optional blank CSV fields to omitted contact input keys", () => {
    const input = mapContactCsvRowToInput({
      displayName: "Alex",
      primaryPhone: "+12025550100",
      secondaryPhone: "",
      company: "",
      notes: "",
    });

    expect(input).toEqual({
      displayName: "Alex",
      primaryPhone: "+12025550100",
    });
  });
});
