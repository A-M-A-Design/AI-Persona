/**
 * Lecture de `tokens/` et traduction d'un token en déclaration CSS.
 *
 * Ce module porte tout ce que le générateur de thèmes doit savoir du format
 * DTCG : charger un set, résoudre les alias, nommer la variable, encoder la
 * valeur. Les règles d'encodage ont été relevées type par type sur le
 * `theme.css` livré par le WDS, pour que la bascule ne change aucune valeur.
 *
 * `check-tokens.mjs` n'importe rien d'ici, volontairement : il compare deux CSS
 * et ne connaît pas les tokens, ce qui est la condition pour qu'il puisse
 * contredire ce module.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ---------- chargement ----------

function walk(node, path, visit) {
  if (node && typeof node === "object" && node.$value !== undefined) return visit(path, node);
  if (node && typeof node === "object")
    for (const key of Object.keys(node)) walk(node[key], path ? `${path}.${key}` : key, visit);
}

/** Charge un set (« colorModes/light ») en Map chemin → token. */
export function loadSet(tokensDir, rel) {
  const file = join(tokensDir, `${rel}.json`);
  if (!existsSync(file)) throw new Error(`set absent : tokens/${rel}.json`);
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
export function resolveValue(value, scope, trail = []) {
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

// ---------- nom de la variable ----------

/** ama.sem.color.on-surface-hi → ama-sem-color-on-surface-hi */
export function varName(path) {
  return path
    .replace(/^ama\./, "ama-")
    .replace(/\./g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

// ---------- encodage de la valeur ----------

const FONT_WEIGHTS = { Regular: "400", Italic: "400", Medium: "500", Bold: "700" };

const REM_TYPES = new Set([
  "sizing",
  "spacing",
  "fontSizes",
  "lineHeights",
  "letterSpacing",
  "borderWidth",
  "borderRadius",
]);

/** 16 → « 1rem », 0.5 → « 0.03125rem », 0 → « 0 » (le CSS n'unite pas le zéro). */
function toRem(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (n === 0) return "0";
  return `${Number((n / 16).toFixed(6))}rem`;
}

const hex2 = (n) => n.toString(16).padStart(2, "0");

/**
 * `rgba(10,7,2,0.05)` → `#0a07020d`, comme l'émetteur du WDS. La notation
 * hexadécimale à huit chiffres est celle du theme.css livré ; s'en écarter
 * n'aurait rien changé au rendu, mais aurait rempli le diff de la bascule.
 */
function colorToCss(value) {
  const raw = String(value).trim();
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(raw);
  if (rgba) {
    const [r, g, b] = [rgba[1], rgba[2], rgba[3]].map(Number);
    const a = rgba[4] === undefined ? 1 : Number(rgba[4]);
    return `#${hex2(r)}${hex2(g)}${hex2(b)}${a >= 1 ? "" : hex2(Math.round(a * 255))}`;
  }
  return raw.toLowerCase();
}

/** Encode la valeur résolue d'un token comme le fait l'émetteur CSS du WDS. */
export function toCss(type, value, path) {
  if (typeof value === "string" && value.startsWith("var(")) return value;
  if (type === "color") return colorToCss(value);
  if (REM_TYPES.has(type)) return toRem(value);
  if (type === "fontWeights") return FONT_WEIGHTS[value] ?? String(value);
  if (type === "number") {
    // `number` est hétérogène : les opacités sont des pourcentages, le reste
    // (flous et décalages d'ombre) est une longueur.
    return /opacity/i.test(path) ? String(Number(value) / 100) : toRem(value);
  }
  // Une valeur composite déjà résolue — un dégradé, par exemple — porte des
  // couleurs qu'il faut ramener à la même casse que les autres.
  return /#[0-9a-fA-F]{3,8}\b/.test(String(value))
    ? String(value).replace(/#[0-9a-fA-F]{3,8}\b/g, (h) => h.toLowerCase())
    : String(value);
}

// ---------- portées ----------

/** Tokens que l'émetteur CSS du WDS n'écrit pas : ils n'existent que dans Figma. */
export const NOT_EMITTED = [/^ama\.sem\.text\.(brandName|modeName|breakpointName)$/];

/**
 * Les blocs du thème, dans l'ordre où le `theme.css` du WDS les pose.
 *
 * Le bloc de base porte les primitives, les tokens hors breakpoint **et** le
 * mode clair, que le système pose en défaut avant les sélecteurs de mode — un
 * document sans `data-color-mode` doit s'afficher en clair.
 */
export const SCOPES = [
  { key: "base", media: null, sets: ["breakpoints/crossBpts", "colorModes/light"], primitives: true },
  { key: "desktopMD", media: "(min-width: 1280px)", sets: ["breakpoints/desktopMD"] },
  { key: "desktopSM", media: "(min-width: 1024px) and (max-width: 1279px)", sets: ["breakpoints/desktopSM"] },
  { key: "mobile", media: "(max-width: 767px)", sets: ["breakpoints/mobile"] },
  { key: "tablet", media: "(min-width: 768px) and (max-width: 1023px)", sets: ["breakpoints/tablet"] },
  { key: "light", mode: "light", sets: ["colorModes/light"] },
  { key: "dark", mode: "dark", sets: ["colorModes/dark"] },
];
