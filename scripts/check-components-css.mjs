/**
 * Vérifie que le CSS applicatif tient debout sur le seul contrat `--ama-*`.
 *
 * Trois contrôles, tous motivés par des pannes *silencieuses* : une variable
 * CSS absente ne produit ni erreur ni avertissement, la déclaration est
 * simplement ignorée et le composant perd sa couleur sans que rien ne le dise.
 *
 *   1. Toute variable consommée est définie dans **les trois** thèmes. Un token
 *      présent chez `ours` mais pas chez `libellule` ne se verrait qu'en
 *      naviguant jusqu'à ce persona, dans ce mode de couleur, sur cet écran.
 *   2. Aucune primitive ni alias : le CSS applicatif ne lit que `sem` et `comp`
 *      (cf. docs/tokens.md). Lire une primitive court-circuite la sémantique et
 *      fige une valeur de marque dans un composant.
 *   3. Plus aucune référence `--wel-*`, l'ancien contrat.
 *
 * Usage : npm run css:check
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const themesDir = join(root, "styles", "generated");
const PERSONAS = ["ours", "corneille", "libellule"];

/** Fichiers de CSS applicatif : tout ce qui consomme le contrat sans le définir. */
const componentsDir = join(root, "styles", "components");
const sources = [
  ...readdirSync(componentsDir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => join(componentsDir, f)),
  join(root, "styles", "persona-extras.css"),
  join(root, "app", "globals.css"),
];

// `var(--ama-x, repli)` : on ne retient que le nom, jamais le repli — c'est
// l'absence du token qu'on traque, et un repli ne fait que la maquiller.
const CONSOMME = /var\(\s*(--ama-[a-z0-9-]+)/gi;
const DEFINI = /^\s*(--ama-[a-z0-9-]+)\s*:/gim;

const definis = new Map(
  PERSONAS.map((p) => {
    const css = readFileSync(join(themesDir, `${p}.css`), "utf8");
    return [p, new Set([...css.matchAll(DEFINI)].map((m) => m[1]))];
  }),
);

const erreurs = [];
let consommeesTotal = 0;

for (const fichier of sources) {
  const css = readFileSync(fichier, "utf8");
  const court = relative(root, fichier).replace(/\\/g, "/");

  for (const [i, ligne] of css.split("\n").entries()) {
    if (ligne.includes("--wel-")) {
      erreurs.push(`${court}:${i + 1} — référence à l'ancien contrat --wel-*`);
    }
  }

  const noms = new Set([...css.matchAll(CONSOMME)].map((m) => m[1]));
  consommeesTotal += noms.size;

  for (const nom of [...noms].sort()) {
    if (!/^--ama-(sem|comp)-/.test(nom)) {
      erreurs.push(`${court} — ${nom} n'est ni sem ni comp (primitive ou alias)`);
      continue;
    }
    const absents = PERSONAS.filter((p) => !definis.get(p).has(nom));
    if (absents.length) {
      erreurs.push(`${court} — ${nom} absent du thème : ${absents.join(", ")}`);
    }
  }
}

if (erreurs.length) {
  console.error(`✘ ${erreurs.length} problème(s) dans le CSS applicatif :\n`);
  for (const e of erreurs) console.error(`  ${e}`);
  console.error(
    "\n  Si les thèmes sont périmés : npm run tokens:build && npm run themes:build",
  );
  process.exit(1);
}

console.log(
  `✔ ${consommeesTotal} références de tokens vérifiées dans ${sources.length} fichiers,`,
);
console.log("  toutes définies dans les 3 thèmes, toutes en sem/comp.");
