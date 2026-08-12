/**
 * Génère les 3 thèmes persona à partir de l'export de tokens `tokens/`.
 *
 * C'est le pipeline du site : `styles/generated/<persona>.css` sort d'ici, et
 * `tokens/` en est la seule source. La teinte de l'avatar vit dans ses
 * primitives ; ce script ne fait que résoudre la chaîne
 * sémantique → alias → primitive et encoder chaque valeur en CSS.
 *
 * Les blocs reproduisent ceux du `theme.css` du WDS : un bloc de base qui porte
 * les primitives, le hors-breakpoint et le mode clair par défaut, quatre media
 * queries, puis les deux modes de couleur.
 *
 * La bascule vers cette source ne devait changer aucune valeur, et
 * `npm run tokens:check` le vérifie en régénérant les mêmes thèmes par l'ancien
 * chemin — teinte du CSS aplati du WDS, sans jamais résoudre un token — puis en
 * comparant. Les deux routes sont indépendantes ; c'est ce qui donne son sens à
 * la comparaison.
 *
 * Usage : npm run themes:build
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { NOT_EMITTED, SCOPES, loadSet, resolveValue, toCss, varName } from "./lib/token-css.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokensDir = join(root, "tokens");
const outDir = join(root, "styles", "generated");
const PERSONAS = ["ours", "corneille", "libellule"];

if (!existsSync(tokensDir)) {
  console.error("✘ tokens/ absent — lancer d'abord : npm run tokens:build");
  process.exit(1);
}

const numbers = loadSet(tokensDir, "primitives/numbers");
const sets = new Map();
const set = (rel) => {
  if (!sets.has(rel)) sets.set(rel, loadSet(tokensDir, rel));
  return sets.get(rel);
};

/** Émet les déclarations d'une portée, sans indentation : le bloc s'en charge. */
function declarations(tokens, scope) {
  const lignes = [];
  for (const [path, token] of tokens) {
    if (NOT_EMITTED.some((re) => re.test(path))) continue;
    lignes.push(`--${varName(path)}: ${toCss(token.$type, resolveValue(token.$value, scope), path)};`);
  }
  return lignes;
}

mkdirSync(outDir, { recursive: true });

for (const persona of PERSONAS) {
  const primitives = new Map([...numbers, ...loadSet(tokensDir, `primitives/${persona}`)]);
  const brand = loadSet(tokensDir, `brands/${persona}`);
  const selecteur = `[data-persona="${persona}"]`;

  const blocs = [];
  for (const portee of SCOPES) {
    const publics = new Map();
    for (const rel of portee.sets) for (const [p, t] of set(rel)) publics.set(p, t);
    const scope = new Map([...primitives, ...brand, ...publics]);

    const corps = [];
    // `color-scheme` n'est pas un token : il dit au navigateur comment peindre
    // ses propres surfaces — barres de défilement, champs natifs. Le WDS ne le
    // pose que sur le bloc de base.
    if (portee.key === "base") corps.push("color-scheme: light;");
    if (portee.primitives) corps.push(...declarations(primitives, scope));
    corps.push(...declarations(publics, scope));

    // Déclarations à la colonne zéro, y compris sous une media query : c'est le
    // style du theme.css livré, et 500 lignes d'indentation pèsent 2 Ko pour
    // rien dans un fichier que personne ne lit à la main.
    const cible = portee.mode ? `${selecteur}[data-color-mode="${portee.mode}"]` : selecteur;
    blocs.push(
      portee.media
        ? `@media ${portee.media} {\n  ${cible} {\n${corps.join("\n")}\n  }\n}`
        : `${cible} {\n${corps.join("\n")}\n}`,
    );
  }

  const entete =
    `/* GÉNÉRÉ par scripts/build-themes.mjs — ne pas éditer à la main.\n` +
    `   Persona "${persona}" : résolu depuis tokens/, contrat --ama-*. */\n`;
  const css = `${entete}${blocs.join("\n")}\n`;
  writeFileSync(join(outDir, `${persona}.css`), css);
  console.log(`— ${persona}`);
  console.log(`  ✔ styles/generated/${persona}.css (${Math.round(css.length / 1024)} KB)`);
}

console.log("\n→ Thèmes générés depuis tokens/. Vérifier avec : npm run tokens:check");
