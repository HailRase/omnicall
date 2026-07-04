import { readFileSync, writeFileSync } from "node:fs";

const messagesPath = "src/renderer/i18n/messages.ts";

function mergeLocale(locale, nextMarker) {
  const messages = readFileSync(messagesPath, "utf-8");
  const fragment = readFileSync(`scripts/i18n-${locale}-overrides.fragment.ts`, "utf-8").trim();

  const blockStart = messages.indexOf(`const ${locale}Messages: MessageShape = {`);
  const blockEnd = messages.indexOf(nextMarker, blockStart);
  if (blockStart === -1 || blockEnd === -1) {
    console.error(`Could not locate ${locale}Messages block`);
    process.exit(1);
  }

  const before = messages.slice(0, blockEnd);
  const after = messages.slice(blockEnd);
  const insertAt = before.lastIndexOf("};");
  if (insertAt === -1) {
    console.error(`Could not locate closing brace for ${locale}Messages`);
    process.exit(1);
  }

  const updated = before.slice(0, insertAt) + `,\n${fragment}\n` + before.slice(insertAt) + after;
  writeFileSync(messagesPath, updated);
  console.log(`Merged ${locale.toUpperCase()} overrides`);
}

mergeLocale("fr", "const deMessages: MessageShape = {");
mergeLocale("de", "export type TranslationCatalog");
