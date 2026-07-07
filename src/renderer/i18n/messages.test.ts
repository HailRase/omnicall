import { describe, expect, it } from "vitest";
import { I18N_MESSAGES } from "./messages.js";
import {
  setRendererLanguage,
  translateCurrent,
  translateInLanguage,
} from "./runtime.js";

describe("renderer i18n catalog", () => {
  it("keeps identical translation keys across all locales", () => {
    const ruKeys = Object.keys(I18N_MESSAGES.ru).sort();
    const enKeys = Object.keys(I18N_MESSAGES.en).sort();
    const frKeys = Object.keys(I18N_MESSAGES.fr).sort();
    const deKeys = Object.keys(I18N_MESSAGES.de).sort();
    const bgKeys = Object.keys(I18N_MESSAGES.bg).sort();
    expect(enKeys).toEqual(ruKeys);
    expect(frKeys).toEqual(ruKeys);
    expect(deKeys).toEqual(ruKeys);
    expect(bgKeys).toEqual(ruKeys);
  });

  it("formats interpolation placeholders", () => {
    const ru = translateInLanguage("ru", "settings.content.title", {
      sectionTitle: "Общее",
    });
    const en = translateInLanguage("en", "settings.content.title", {
      sectionTitle: "General",
    });
    expect(ru).toBe("Настройки (Общее)");
    expect(en).toBe("Settings (General)");
  });

  it("switches current language instantly", () => {
    setRendererLanguage("en");
    expect(translateCurrent("settings.title")).toBe("Settings");
    setRendererLanguage("fr");
    expect(translateCurrent("settings.title")).toBe("Parametres");
    setRendererLanguage("de");
    expect(translateCurrent("settings.title")).toBe("Einstellungen");
    setRendererLanguage("bg");
    expect(translateCurrent("settings.title")).toBe("Настройки");
    setRendererLanguage("ru");
    expect(translateCurrent("settings.title")).toBe("Настройки");
  });

  it("keeps non-Russian distinct strings for en/fr/de/bg on migrated dialpad keys", () => {
    const key = "dialpad.call.label" as const;
    const ru = translateInLanguage("ru", key);
    const en = translateInLanguage("en", key);
    const fr = translateInLanguage("fr", key);
    const de = translateInLanguage("de", key);
    const bg = translateInLanguage("bg", key);
    expect(en).not.toBe(ru);
    expect(fr).not.toBe(ru);
    expect(de).not.toBe(ru);
    expect(bg).not.toBe(ru);
  });
});
