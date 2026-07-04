import { readFileSync, writeFileSync } from "node:fs";

const messagesPath = "src/renderer/i18n/messages.ts";
const fragmentPath = "scripts/i18n-en-overrides.fragment.ts";

const messages = readFileSync(messagesPath, "utf-8");
const fragment = readFileSync(fragmentPath, "utf-8").trim();

const enEnd = messages.indexOf('const frMessages: MessageShape = {');
if (enEnd === -1) {
  console.error("frMessages marker not found");
  process.exit(1);
}

const enBlock = messages.slice(0, enEnd);
const rest = messages.slice(enEnd);
const insertAt = enBlock.lastIndexOf("};");
if (insertAt === -1) {
  console.error("enMessages closing brace not found");
  process.exit(1);
}

const updated =
  enBlock.slice(0, insertAt) + `,\n${fragment}\n` + enBlock.slice(insertAt) + rest;

writeFileSync(messagesPath, updated);
console.log("Merged EN overrides into messages.ts");
