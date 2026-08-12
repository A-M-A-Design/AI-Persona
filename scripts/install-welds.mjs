/**
 * Extrait les assets WDS (design system Accor) nécessaires au POC depuis le zip
 * welds-mcp-v3 vers styles/welds-src/ — dossier GITIGNORÉ : l'IP Accor n'entre
 * jamais dans l'historique git (règle d'or du projet).
 *
 * Usage : npm run welds:install
 * Le zip est cherché à la racine du projet, ou via la variable d'env WELDS_ZIP.
 */
import AdmZip from "adm-zip";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const zipPath = process.env.WELDS_ZIP ?? join(root, "welds-mcp-v3.zip");
const outDir = join(root, "styles", "welds-src");

const THEME = "data/assets/themes/brandbook.css";
const COMPONENTS = [
  "button",
  "inputtext",
  "message",
  "chip",
  "avatar",
  "segmentedcontrol",
  "select",
  "skeleton",
  "separator",
  "link",
  "badge",
  "card",
];

if (!existsSync(zipPath)) {
  console.error(`✘ Zip introuvable : ${zipPath}`);
  console.error("  Place welds-mcp-v3.zip à la racine du projet ou définis WELDS_ZIP.");
  process.exit(1);
}

const zip = new AdmZip(zipPath);
mkdirSync(outDir, { recursive: true });

const theme = zip.getEntry(THEME);
if (!theme) {
  console.error(`✘ ${THEME} absent du zip`);
  process.exit(1);
}
/**
 * Le paquet WDS parle `--wel-*`. Le projet parle `--ama-*` : on aligne le
 * préfixe **ici**, à l'extraction, sur le thème comme sur les composants.
 *
 * Faire ce renommage à un seul endroit, le plus en amont possible, est ce qui
 * évite de le traîner ailleurs. La tentation inverse — laisser les composants sur
 * `--wel-*` et faire émettre aux thèmes une couche d'alias `--wel-x: var(--ama-x)`
 * — a été essayée : 358 Ko pour les trois personas, et un piège de portée CSS à
 * désamorcer. Elle reposait sur une contrainte fausse (voir docs/tokens.md).
 *
 * Ces fichiers sont des artefacts locaux, gitignorés et reconstruits par cette
 * commande : les renommer n'altère rien de durable, exactement comme
 * `build-themes.mjs` dérive les thèmes du template. Rien d'autre n'est touché
 * dans le CSS d'Accor — les noms de classes `.wel-*` restent les siens, puisque
 * c'est lui qui les fournit.
 */
const toAmaContract = (css) => css.replace(/--wel-/g, "--ama-");

let renamed = 0;
const align = (css) => {
  renamed += (css.match(/--wel-/g) ?? []).length;
  return toAmaContract(css);
};

writeFileSync(join(outDir, "template.theme.css"), align(zip.readAsText(theme)));
console.log(`✔ template.theme.css (${THEME})`);

let componentsCss = "";
for (const name of COMPONENTS) {
  const entry = zip.getEntry(`private/install/css/${name}.css`);
  if (!entry) {
    console.warn(`⚠ composant absent du zip : ${name}`);
    continue;
  }
  // le renommage couvre aussi les définitions : `.wel-modal` déclare une
  // variable à lui, qu'il consomme dans la foulée.
  componentsCss += `\n/* === ${name} === */\n` + align(zip.readAsText(entry));
  console.log(`✔ ${name}.css`);
}
writeFileSync(join(outDir, "components.css"), componentsCss);

console.log(`\n→ Assets WDS extraits dans ${outDir} (gitignoré).`);
console.log(`  ${renamed} références --wel-* alignées sur le contrat --ama-*.`);
