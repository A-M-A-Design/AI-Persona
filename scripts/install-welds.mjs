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
writeFileSync(join(outDir, "template.theme.css"), zip.readAsText(theme));
console.log(`✔ template.theme.css (${THEME})`);

/**
 * Les composants WDS consomment `var(--wel-…)` en dur. Plutôt que de faire
 * émettre aux thèmes une couche d'alias `--wel-*: var(--ama-*)` — 358 Ko pour
 * les trois personas —, on aligne le contrat à l'extraction : le fichier est de
 * toute façon un artefact local, gitignoré et reconstruit par cette commande,
 * exactement comme `build-themes.mjs` dérive les thèmes du template.
 *
 * C'est un renommage de préfixe, définitions comprises (`.wel-modal` déclare une
 * variable à lui) : rien d'autre n'est touché dans le CSS d'Accor. Les noms de
 * classes `.wel-*` restent ceux du paquet, puisque c'est lui qui les fournit.
 */
const toAmaContract = (css) => css.replace(/--wel-/g, "--ama-");

let componentsCss = "";
let renamed = 0;
for (const name of COMPONENTS) {
  const entry = zip.getEntry(`private/install/css/${name}.css`);
  if (!entry) {
    console.warn(`⚠ composant absent du zip : ${name}`);
    continue;
  }
  const raw = zip.readAsText(entry);
  renamed += (raw.match(/--wel-/g) ?? []).length;
  componentsCss += `\n/* === ${name} === */\n` + toAmaContract(raw);
  console.log(`✔ ${name}.css`);
}
writeFileSync(join(outDir, "components.css"), componentsCss);

console.log(`\n→ Assets WDS extraits dans ${outDir} (gitignoré).`);
console.log(`  ${renamed} références --wel-* alignées sur le contrat --ama-*.`);
