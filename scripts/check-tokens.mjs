/**
 * Vérificateur de non-régression de l'export de tokens AMa.
 *
 * Il résout la chaîne complète — ama.sem/ama.comp → ama.web.bSem/bComp →
 * ama.prim — pour les 3 avatars × 2 modes × 5 breakpoints, puis compare chaque
 * valeur obtenue à la variable CSS correspondante de styles/generated/*.css,
 * qui est la référence en production. Toute divergence fait échouer la commande.
 *
 * C'est l'oracle du chantier : `tokens/` n'a de valeur que s'il redonne
 * exactement ce que le site affiche aujourd'hui. Le script est délibérément
 * indépendant du générateur (il ne partage aucun code avec lui, pas même la
 * transformation de teinte) — sinon il validerait ses propres erreurs.
 *
 * Usage : npm run tokens:check
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokensDir = join(root, "tokens");
const generatedDir = join(root, "styles", "generated");
const PERSONAS = ["ours", "corneille", "libellule"];

if (!existsSync(tokensDir)) {
  console.error("✘ tokens/ absent — lancer d'abord : npm run tokens:build");
  process.exit(1);
}

// ---------- chargement des sets ----------

function walk(node, path, visit) {
  if (node && typeof node === "object" && node.$value !== undefined) return visit(path, node);
  if (node && typeof node === "object")
    for (const key of Object.keys(node)) walk(node[key], path ? `${path}.${key}` : key, visit);
}

function loadSet(rel) {
  const file = join(tokensDir, `${rel}.json`);
  if (!existsSync(file)) {
    console.error(`✘ set absent : tokens/${rel}.json`);
    process.exit(1);
  }
  const tokens = new Map();
  walk(JSON.parse(readFileSync(file, "utf8")), "", (p, t) => tokens.set(p, t));
  return tokens;
}

// ---------- résolution des alias ----------

/**
 * Remplace les références {a.b.c} par la valeur de la cible, récursivement.
 * Un alias pur ({x} seul) rend la valeur brute — c'est ce qui permet à un token
 * numérique de rester un nombre. Une valeur composite (un linear-gradient, par
 * exemple) rend une chaîne interpolée.
 */
function resolveValue(value, scope, trail = []) {
  if (typeof value !== "string") return value;

  const pure = /^\{([^}]+)\}$/.exec(value);
  if (pure) {
    const ref = pure[1];
    if (trail.includes(ref)) throw new Error(`cycle d'alias : ${[...trail, ref].join(" → ")}`);
    const target = scope.get(ref);
    if (!target) throw new Error(`référence introuvable : {${ref}}`);
    return resolveValue(target.$value, scope, [...trail, ref]);
  }

  return value.replace(/\{([^}]+)\}/g, (_, ref) => {
    if (trail.includes(ref)) throw new Error(`cycle d'alias : ${[...trail, ref].join(" → ")}`);
    const target = scope.get(ref);
    if (!target) throw new Error(`référence introuvable : {${ref}}`);
    return String(resolveValue(target.$value, scope, [...trail, ref]));
  });
}

// ---------- token → variable CSS ----------

/** ama.sem.color.on-surface-hi → wel-sem-color-on-surface-hi (au préfixe près). */
function varName(path, prefix) {
  return path
    .replace(/^ama\./, `${prefix}-`)
    .replace(/\./g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

// ---------- valeur token → valeur CSS ----------

const FONT_WEIGHTS = { Regular: "400", Italic: "400", Medium: "500", Bold: "700" };

/** 16 → « 1rem », 0.5 → « 0.0313rem », 0 → « 0 » (le CSS n'unite pas le zéro). */
function toRem(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (n === 0) return "0";
  return `${Number((n / 16).toFixed(4))}rem`;
}

const REM_TYPES = new Set([
  "sizing",
  "spacing",
  "fontSizes",
  "lineHeights",
  "letterSpacing",
  "borderWidth",
  "borderRadius",
]);

/**
 * Encode la valeur résolue d'un token comme le fait l'émetteur CSS du WDS.
 * Les règles ont été relevées sur le theme.css livré, type par type.
 */
function toCss(type, value, path) {
  if (typeof value === "string" && value.startsWith("var(")) return value;
  if (REM_TYPES.has(type)) return toRem(value);
  if (type === "fontWeights") return FONT_WEIGHTS[value] ?? String(value);
  if (type === "number") {
    // `number` est hétérogène : les opacités sont des pourcentages, le reste
    // (flous et décalages d'ombre) est une longueur.
    return /opacity/i.test(path) ? String(Number(value) / 100) : toRem(value);
  }
  return String(value);
}

/**
 * Ramène deux écritures d'une même valeur à une forme comparable : couleurs sous
 * toutes leurs notations, et longueurs quelle que soit l'unité.
 *
 * Les longueurs sont ramenées au pixel puis arrondies au dix-millième de rem —
 * l'émetteur CSS du WDS n'arrondit pas de la même façon selon la couche (une
 * primitive garde 0.03125rem là où un token sémantique est écrit 0.0313rem), et
 * les overrides des avatars sont écrits en px. Ces écarts d'écriture ne sont pas
 * des divergences ; un vrai changement de valeur reste détecté.
 */
function normalize(value) {
  let v = String(value).trim().toLowerCase().replace(/\s+/g, " ");

  const length = /^(-?[\d.]+)(rem|px)$/.exec(v);
  if (length) {
    const px = length[2] === "rem" ? Number(length[1]) * 16 : Number(length[1]);
    return `${Number((px / 16).toFixed(4))}rem`;
  }

  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(v);
  if (rgba) {
    const [r, g, b] = [rgba[1], rgba[2], rgba[3]].map(Number);
    const a = rgba[4] === undefined ? 1 : Number(rgba[4]);
    const hex = (n) => n.toString(16).padStart(2, "0");
    const alpha = a >= 1 ? "" : hex(Math.round(a * 255));
    return `#${hex(r)}${hex(g)}${hex(b)}${alpha}`;
  }

  const hex8 = /^(#[0-9a-f]{6})ff$/.exec(v);
  if (hex8) return hex8[1];

  const hex3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
  if (hex3) return `#${hex3[1]}${hex3[1]}${hex3[2]}${hex3[2]}${hex3[3]}${hex3[3]}`;

  return v.replace(/,\s*/g, ", ");
}

// ---------- lecture du CSS généré ----------

/**
 * Découpe styles/generated/<persona>.css en blocs de portée. Les blocs sont
 * plats et sans imbrication autre que les media queries, ce qui autorise un
 * découpage par accolades équilibrées plutôt qu'un vrai parseur.
 */
function parseGenerated(css, persona) {
  const scopes = new Map();

  const addBlock = (key, body) => {
    const decls = scopes.get(key) ?? new Map();
    for (const m of body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) decls.set(m[1], m[2].trim());
    scopes.set(key, decls);
  };

  const selectorKey = (selector, media) => {
    if (/data-color-mode="dark"/.test(selector)) return "dark";
    if (/data-color-mode="light"/.test(selector)) return "light";
    if (/min-width:\s*1280px/.test(media)) return "desktopMD";
    if (/min-width:\s*1024px/.test(media)) return "desktopSM";
    if (/max-width:\s*767px/.test(media)) return "mobile";
    if (/min-width:\s*768px/.test(media)) return "tablet";
    return "base";
  };

  // parcours linéaire : on suit la profondeur d'accolades pour distinguer une
  // règle de premier niveau d'une règle enfermée dans une media query.
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
      for (const m of body.matchAll(/([^{}]+)\{([^{}]*)\}/g))
        addBlock(selectorKey(m[1], head), m[2]);
    } else {
      addBlock(selectorKey(head, ""), body);
    }
    i = close + 1;
  }

  if (!scopes.has("base")) throw new Error(`aucun bloc de base dans ${persona}.css`);
  return scopes;
}

// ---------- composition des portées ----------

/**
 * Chaque bloc du CSS généré correspond à une combinaison de sets de tokens.
 * Le bloc de base porte à la fois les tokens hors breakpoint et le mode clair,
 * que le theme.css pose en défaut avant les sélecteurs de mode.
 */
const SCOPES = [
  ["base", ["breakpoints/crossBpts", "colorModes/light"]],
  ["light", ["colorModes/light"]],
  ["dark", ["colorModes/dark"]],
  ["desktopMD", ["breakpoints/desktopMD"]],
  ["desktopSM", ["breakpoints/desktopSM"]],
  ["tablet", ["breakpoints/tablet"]],
  ["mobile", ["breakpoints/mobile"]],
];

/** Tokens présents dans l'export mais que l'émetteur CSS du WDS n'écrit pas. */
const NOT_EMITTED = [/^ama\.sem\.text\.(brandName|modeName|breakpointName)$/];

/**
 * Primitives que l'export porte et que styles/generated/*.css n'écrit pas.
 * Liste fermée et justifiée : hors de cette liste, une primitive absente du CSS
 * est une erreur du générateur.
 *
 *  - navalGrey.6 est la nuance du `surface-alternative` sombre, que le paquet
 *    WDS installé ne livre pas du tout ;
 *  - tropos.97 est celle du `surface-alternative` clair : elle existe dans
 *    l'export Accor, mais rien ne la référence dans le theme.css installé, qui
 *    n'émet donc pas la variable.
 *
 * Les deux ne concernent que la couche des primitives, que l'application ne
 * consomme jamais. Ce que le site consomme — sem et comp — reste comparé
 * intégralement, y compris `--wel-sem-color-surface-alternative`.
 */
const AMA_ONLY_PRIMITIVES = new Set([
  "ama.prim.color.navalGrey.6",
  "ama.prim.color.tropos.97",
]);

// ---------- vérification ----------

const prefix = process.env.TOKENS_CSS_PREFIX ?? "wel";
const numbers = loadSet("primitives/numbers");

let mismatches = 0;
let checked = 0;
let uncovered = 0;
let amaOnly = 0;
const report = [];

for (const persona of PERSONAS) {
  const cssPath = join(generatedDir, `${persona}.css`);
  if (!existsSync(cssPath)) {
    console.error(`✘ ${cssPath} absent — lancer d'abord : npm run themes:build`);
    process.exit(1);
  }

  const primitives = new Map([...numbers, ...loadSet(`primitives/${persona}`)]);
  const brand = loadSet(`brands/${persona}`);
  const cssScopes = parseGenerated(readFileSync(cssPath, "utf8"), persona);

  // les variables du CSS qu'aucun token n'explique, par portée
  const seenByScope = new Map();

  for (const [scopeKey, sets] of SCOPES) {
    const publicTokens = new Map();
    for (const set of sets) for (const [p, t] of loadSet(set)) publicTokens.set(p, t);
    const scope = new Map([...primitives, ...brand, ...publicTokens]);
    const cssVars = cssScopes.get(scopeKey);
    if (!cssVars) {
      report.push(`✘ [${persona}] bloc CSS « ${scopeKey} » introuvable`);
      mismatches++;
      continue;
    }
    const seen = seenByScope.get(scopeKey) ?? new Set();

    // les primitives ne sont écrites que dans le bloc de base
    const toCheck =
      scopeKey === "base" ? [...primitives, ...publicTokens] : [...publicTokens];

    for (const [path, token] of toCheck) {
      if (NOT_EMITTED.some((re) => re.test(path))) continue;
      const name = varName(path, prefix);
      seen.add(name);

      let expected;
      try {
        expected = toCss(token.$type, resolveValue(token.$value, scope), path);
      } catch (error) {
        report.push(`✘ [${persona}/${scopeKey}] ${path} : ${error.message}`);
        mismatches++;
        continue;
      }

      const actual = cssVars.get(name);
      if (actual === undefined) {
        if (AMA_ONLY_PRIMITIVES.has(path)) {
          amaOnly++;
          continue;
        }
        report.push(`✘ [${persona}/${scopeKey}] --${name} : absent du CSS généré`);
        mismatches++;
        continue;
      }

      checked++;
      if (normalize(actual) !== normalize(expected)) {
        report.push(
          `✘ [${persona}/${scopeKey}] --${name}\n      tokens : ${expected}\n      CSS    : ${actual}`,
        );
        mismatches++;
      }
    }
    seenByScope.set(scopeKey, seen);
  }

  // inventaire inverse : variables du CSS qu'aucun token ne produit
  for (const [scopeKey, cssVars] of cssScopes) {
    const seen = seenByScope.get(scopeKey) ?? new Set();
    for (const name of cssVars.keys()) {
      if (!name.startsWith(`${prefix}-`)) continue;
      if (seen.has(name)) continue;
      // le bloc de base porte aussi les valeurs des autres portées en défaut
      if (scopeKey !== "base" && (seenByScope.get("base") ?? new Set()).has(name)) continue;
      uncovered++;
      report.push(`⚠ [${persona}/${scopeKey}] --${name} : aucun token ne le produit`);
    }
  }
}

// ---------- verdict ----------

for (const line of report.slice(0, 80)) console.log(line);
if (report.length > 80) console.log(`   … et ${report.length - 80} autres lignes`);

console.log(
  `\n${checked} valeurs comparées · ${mismatches} divergence(s) · ${uncovered} variable(s) CSS sans token` +
    `\n${amaOnly} primitive(s) propres à AMa, déclarées et hors comparaison`,
);

if (mismatches || uncovered) {
  console.error("\n✘ RÉGRESSION : l'export de tokens ne redonne pas le CSS en production.");
  process.exit(1);
}
console.log("\n✔ Zéro régression : la chaîne ama redonne exactement styles/generated/*.css.");
