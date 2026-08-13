/**
 * Extrait le thème WDS (design system Accor) depuis le zip welds-mcp-v3 vers
 * styles/welds-src/ — dossier GITIGNORÉ : l'IP Accor n'entre jamais dans
 * l'historique git (règle d'or du projet).
 *
 * **Le site ne sert plus rien de ce dossier.** Depuis la réécriture des
 * composants (`styles/components/*.css`), `template.theme.css` n'a plus qu'un
 * usage : servir d'oracle à `npm run tokens:check`, qui compare les thèmes
 * générés depuis `tokens/` à une référence obtenue par un tout autre chemin.
 * C'est un outil de vérification, pas une dépendance de build — un `npm run
 * build` réussit sans ce dossier, et c'est ce qui rend le dépôt déployable.
 *
 * Les composants ne sont donc plus extraits. Ils l'étaient au POC pour douze
 * d'entre eux, dont six n'ont jamais servi ; les six autres sont désormais
 * écrits dans `styles/components/`, sur le même contrat `--ama-*`.
 *
 * Usage : npm run welds:install
 * Le zip est cherché à la racine du projet, ou via la variable d'env WELDS_ZIP.
 */
import AdmZip from "adm-zip";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const zipPath = process.env.WELDS_ZIP ?? join(root, "welds-mcp-v3.zip");
const outDir = join(root, "styles", "welds-src");

const THEME = "data/assets/themes/brandbook.css";

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
 * dans le CSS d'Accor.
 */
const toAmaContract = (css) => css.replace(/--wel-/g, "--ama-");

let renamed = 0;
const align = (css) => {
  renamed += (css.match(/--wel-/g) ?? []).length;
  return toAmaContract(css);
};

writeFileSync(join(outDir, "template.theme.css"), align(zip.readAsText(theme)));
console.log(`✔ template.theme.css (${THEME})`);

// Un `components.css` d'une extraction antérieure serait encore lu par personne,
// mais il traînerait dans le dossier et laisserait croire qu'il sert. On l'ôte.
const ancien = join(outDir, "components.css");
if (existsSync(ancien)) {
  rmSync(ancien);
  console.log("✔ components.css retiré (les composants sont écrits dans styles/components/)");
}

console.log(`\n→ Thème WDS extrait dans ${outDir} (gitignoré).`);
console.log(`  ${renamed} références --wel-* alignées sur le contrat --ama-*.`);
console.log("  Sert d'oracle à npm run tokens:check — le build n'en dépend pas.");
