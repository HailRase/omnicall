import { readFileSync } from "node:fs";

const src = readFileSync("src/renderer/i18n/messages.ts", "utf-8");
const ruStart = src.indexOf("const ruMessages = {");
const ruEnd = src.indexOf("};\n\ntype MessageShape");
const ruBlock = src.slice(ruStart, ruEnd);
const keys = [...ruBlock.matchAll(/"([^"]+)":/g)].map((m) => m[1]);
console.log("key count", keys.length);
