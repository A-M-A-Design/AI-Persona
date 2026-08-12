/**
 * Vérificateur des thèmes servis : compare `styles/generated/*.css` à une
 * référence dérivée par un tout autre chemin.
 *
 * Le pipeline résout la chaîne de tokens. La référence, elle, part du
 * `theme.css` aplati du WDS et lui applique la teinte de l'avatar littéral par
 * littéral, **sans jamais résoudre un alias ni lire `tokens/`**. Deux routes
 * indépendantes vers la même couleur : c'est ce qui donne son sens à la
 * comparaison, et c'est pourquoi ce script n'importe rien de
 * `scripts/lib/token-css.mjs`. Un oracle qui partagerait le code du générateur
 * validerait ses propres erreurs.
 *
 * Vérifie aussi qu'aucun `--wel-*` ne subsiste dans le contrat.
 *
 * La référence disparaîtra avec `styles/welds-src/`, à la réécriture des
 * composants WDS — ce jour-là, `tokens/` sera seul et il faudra un autre oracle.
 *
 * Usage : npm run tokens:check
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const generatedDir = join(root, "styles", "generated");
const PERSONAS = ["ours", "corneille", "libellule"];

// ---------- lecture d'un thème ----------

/**
 * Découpe un thème en blocs de portée. Les blocs sont plats et sans imbrication
 * autre que les media queries, ce qui autorise un découpage par accolades
 * équilibrées plutôt qu'un vrai parseur.
 */
function parseTheme(css, source) {
  const scopes = new Map();

  const add = (key, body) => {
    const decls = scopes.get(key) ?? new Map();
    for (const m of body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) decls.set(m[1], m[2].trim());
    scopes.set(key, decls);
  };

  const keyOf = (selector, media) => {
    if (/data-color-mode="dark"/.test(selector)) return "dark";
    if (/data-color-mode="light"/.test(selector)) return "light";
    if (/min-width:\s*1280px/.test(media)) return "desktopMD";
    if (/min-width:\s*1024px/.test(media)) return "desktopSM";
    if (/max-width:\s*767px/.test(media)) return "mobile";
    if (/min-width:\s*768px/.test(media)) return "tablet";
    return "base";
  };

  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open === -1) break;
    const head = css.slice(i, open).trim();
    let depth = 0;
    let close = open;
    for (; close < css.length; close++) {
      if (css[close] === "{") depth++;
      else if (css[close] === "}" && --depth === 0) break;
    }
    const body = css.slice(open + 1, close);

    if (head.startsWith("@media")) {
      for (const m of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) add(keyOf(m[1], head), m[2]);
    } else {
      add(keyOf(head, ""), body);
    }
    i = close + 1;
  }

  if (!scopes.has("base")) throw new Error(`aucun bloc de base dans ${source}`);
  return scopes;
}

// ---------- comparaison de valeurs ----------

/**
 * Ramène deux écritures d'une même valeur à une forme comparable : couleurs
 * sous toutes leurs notations, longueurs quelle que soit l'unité.
 *
 * Les longueurs sont ramenées au pixel puis arrondies au dix-millième de rem —
 * les deux émetteurs n'arrondissent pas au même rang, et les overrides des
 * avatars sont écrits en px. Ces écarts d'écriture ne sont pas des divergences ;
 * un vrai changement de valeur reste détecté.
 */
function normalize(value) {
  const v = String(value).trim().toLowerCase().replace(/\s+/g, " ");

  const length = /^(-?[\d.]+)(rem|px)$/.exec(v);
  if (length) {
    const px = length[2] === "rem" ? Number(length[1]) * 16 : Number(length[1]);
    return `${Number((px / 16).toFixed(4))}rem`;
  }

  return v.replace(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)|#[0-9a-f]{3,8}\b/g, (c) =>
    normalizeColor(c),
  );
}

function normalizeColor(color) {
  const hex2 = (n) => n.toString(16).padStart(2, "0");
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(color);
  if (rgba) {
    const [r, g, b] = [rgba[1], rgba[2], rgba[3]].map(Number);
    const a = rgba[4] === undefined ? 1 : Number(rgba[4]);
    return `#${hex2(r)}${hex2(g)}${hex2(b)}${a >= 1 ? "" : hex2(Math.round(a * 255))}`;
  }
  const h = color.replace("#", "");
  const full =
    h.length <= 4
      ? h.split("").map((c) => c + c).join("")
      : h;
  return `#${full.length === 8 && full.slice(6) === "ff" ? full.slice(0, 6) : full}`;
}

// ---------- génération de la référence ----------

const tmp = mkdtempSync(join(tmpdir(), "ama-ref-"));
try {
  execFileSync(process.execPath, [join(root, "scripts", "build-themes-wds.mjs"), tmp], {
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (error) {
  rmSync(tmp, { recursive: true, force: true });
  console.error("✘ la référence WDS n'a pas pu être générée :");
  console.error(String(error.stderr ?? error.stdout ?? error.message).trim());
  console.error("  Si le template manque ou est périmé : npm run welds:install");
  process.exit(1);
}

// ---------- vérification ----------

/**
 * Variables que le pipeline émet et que la référence WDS ne peut pas porter :
 * le paquet installé ne livre pas `surface-alternative`, donc les primitives qui
 * le portent n'apparaissent dans aucun `theme.css`. Liste fermée — hors d'elle,
 * une variable en trop est une erreur du générateur.
 */
const HORS_REFERENCE = new Set([
  "ama-prim-color-naval-grey-6",
  "ama-prim-color-tropos-97",
]);

let compares = 0;
let divergences = 0;
let horsReference = 0;
const rapport = [];

for (const persona of PERSONAS) {
  const servi = parseTheme(readFileSync(join(generatedDir, `${persona}.css`), "utf8"), `${persona}.css`);
  const reference = parseTheme(readFileSync(join(tmp, `${persona}.css`), "utf8"), `référence ${persona}`);

  for (const [portee, attendues] of reference) {
    const obtenues = servi.get(portee);
    if (!obtenues) {
      rapport.push(`✘ [${persona}] bloc « ${portee} » absent du thème servi`);
      divergences++;
      continue;
    }

    for (const [nom, attendue] of attendues) {
      const obtenue = obtenues.get(nom);
      if (obtenue === undefined) {
        rapport.push(`✘ [${persona}/${portee}] --${nom} : absente du thème servi`);
        divergences++;
        continue;
      }
      compares++;
      if (normalize(obtenue) !== normalize(attendue)) {
        rapport.push(
          `✘ [${persona}/${portee}] --${nom}\n      servi     : ${obtenue}\n      référence : ${attendue}`,
        );
        divergences++;
      }
    }

    // et l'inverse : rien ne doit être servi que la référence ignore
    for (const nom of obtenues.keys()) {
      if (attendues.has(nom)) continue;
      if (HORS_REFERENCE.has(nom)) {
        horsReference++;
        continue;
      }
      rapport.push(`✘ [${persona}/${portee}] --${nom} : servie sans contrepartie dans la référence`);
      divergences++;
    }
  }
}

// ---------- le contrat est unique ----------

/**
 * Plus rien ne doit consommer `--wel-*`. Si un en revenait — ancien
 * `install-welds.mjs` rétabli, CSS Accor collé à la main —, plus aucun thème ne
 * le définirait : les composants perdraient leurs couleurs **en silence**, un
 * test de contraste ne mesurant que ce qui est peint, pas ce qui a disparu.
 */
const FICHIERS_CONTRAT = [
  ...PERSONAS.map((p) => join(generatedDir, `${p}.css`)),
  join(root, "styles", "welds-src", "components.css"),
  join(root, "styles", "persona-extras.css"),
  join(root, "app", "globals.css"),
];

let fichiersVerifies = 0;
for (const fichier of FICHIERS_CONTRAT) {
  if (!existsSync(fichier)) continue; // components.css est gitignoré
  fichiersVerifies++;
  const restes = readFileSync(fichier, "utf8").match(/--wel-[a-z0-9-]+/g);
  if (!restes) continue;
  rapport.push(
    `✘ ${relative(root, fichier)} : ${restes.length} référence(s) à --wel-*, que plus aucun thème ne définit` +
      `\n      ex. ${[...new Set(restes)].slice(0, 3).join(", ")}`,
  );
  divergences++;
}

rmSync(tmp, { recursive: true, force: true });

// ---------- verdict ----------

for (const ligne of rapport.slice(0, 60)) console.log(ligne);
if (rapport.length > 60) console.log(`   … et ${rapport.length - 60} autres lignes`);

console.log(
  `\n${compares} valeurs comparées à la référence WDS · ${divergences} divergence(s)` +
    `\n${horsReference} variable(s) hors référence, déclarées` +
    `\n${fichiersVerifies} fichier(s) CSS sans aucune référence à --wel-*`,
);

if (divergences) {
  console.error("\n✘ RÉGRESSION : les thèmes servis ne redonnent pas la référence WDS.");
  process.exit(1);
}
console.log("\n✔ Les thèmes résolus depuis tokens/ redonnent exactement la référence WDS.");
