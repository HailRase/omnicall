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
    expect(enKeys).toEqual(ruKeys);
    expect(frKeys).toEqual(ruKeys);
    expect(deKeys).toEqual(ruKeys);
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
    setRendererLanguage("ru");
    expect(translateCurrent("settings.title")).toBe("Настройки");
  });
});
