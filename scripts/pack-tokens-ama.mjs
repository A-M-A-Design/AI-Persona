/**
 * Emballe tokens/ en 1.0.0_AMaDesignTokens_<date>_<heure>.zip — même forme que
 * l'export Accor dont il dérive, donc importable tel quel dans Tokens Studio.
 *
 * Le zip est un artefact rebuildable, gitignoré comme tous les zips : la source
 * committée reste le dossier tokens/. On n'emballe que s'il est à jour, sinon on
 * distribuerait un paquet dont personne n'a vérifié la non-régression.
 *
 * Usage : npm run tokens:pack
 */
import AdmZip from "adm-zip";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokensDir = join(root, "tokens");

if (!existsSync(tokensDir)) {
  console.error("✘ tokens/ absent — lancer d'abord : npm run tokens:build");
  process.exit(1);
}

// Emballer un export non vérifié reviendrait à distribuer une régression.
try {
  execFileSync(process.execPath, [join(root, "scripts", "check-tokens.mjs")], {
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch {
  console.error("✘ npm run tokens:check échoue — rien n'est emballé.");
  process.exit(1);
}

const stamp = () => {
  const d = new Date();
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
};

const files = [];
const collect = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collect(full);
    else files.push(full);
  }
};
collect(tokensDir);

const zip = new AdmZip();
for (const file of files.sort()) {
  const rel = relative(tokensDir, file).replace(/\\/g, "/");
  zip.addLocalFile(file, dirname(rel) === "." ? "" : dirname(rel));
}

const name = `1.0.0_AMaDesignTokens_${stamp()}.zip`;
writeFileSync(join(root, name), zip.toBuffer());

console.log(`✔ ${name} — ${files.length} fichiers, ${Math.round(zip.toBuffer().length / 1024)} KB`);
console.log("→ Importable dans Tokens Studio. Le zip est gitignoré ; la source reste tokens/.");
