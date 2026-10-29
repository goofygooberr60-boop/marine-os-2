import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const publicDir = path.join(projectDir, "public");
const outputDir = path.join(projectDir, "dist");

if (!outputDir.startsWith(projectDir + path.sep)) {
  throw new Error("Refusing to build outside the Marine OS project directory.");
}

const files = ["index.html", "marine-enhancements.js", "marine-suite.js", "marine-games.js", "seraph-games.json", "itch-games.json", "marine-netlify.js"];
for (const name of files) {
  if (!fs.existsSync(path.join(publicDir, name))) {
    throw new Error(`Required Netlify site file is missing: public/${name}`);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
for (const name of files) fs.copyFileSync(path.join(publicDir, name), path.join(outputDir, name));

const indexPath = path.join(outputDir, "index.html");
const suiteTag = '<script defer src="/marine-suite.js"></script>';
let html = fs.readFileSync(indexPath, "utf8");
const occurrences = html.split(suiteTag).length - 1;
if (occurrences !== 1) {
  throw new Error(`Expected one ${suiteTag} tag in public/index.html; found ${occurrences}.`);
}
html = html.replace(suiteTag, `${suiteTag}\n<script defer src="/marine-netlify.js"></script>`);
fs.writeFileSync(indexPath, html);

console.log(`Built the static Netlify edition at ${outputDir}`);
