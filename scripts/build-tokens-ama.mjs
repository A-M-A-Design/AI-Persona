/**
 * Construit 1.0.0_AMaDesignTokens — l'export de tokens du portfolio — à partir
 * de l'export Accor 2.2.2 (zip gitignoré, IP Accor).
 *
 * Ce qui change par rapport à la source :
 *  - préfixe `ama` au lieu de `wel` ;
 *  - trois marques, une par avatar (ours, corneille, libellule), toutes dérivées
 *    de `brands/brandbook` — les treize autres marques Accor disparaissent ;
 *  - les primitives de couleur reçoivent la teinte de l'avatar, calculée par
 *    scripts/lib/persona-color.mjs, la même fonction que build-themes.mjs ;
 *  - la chaîne sémantique → alias → primitive est conservée telle quelle : la
 *    teinte ne s'applique qu'aux primitives, tout le reste est du renommage.
 *
 * L'export est un artefact PARALLÈLE : styles/generated/*.css reste produit par
 * build-themes.mjs à partir du theme.css WDS. `npm run tokens:check` prouve que
 * les deux chaînes rendent exactement la même chose. La bascule du pipeline
 * viendra dans un second temps, une fois les composants réécrits.
 *
 * Usage : npm run tokens:build
 * Le zip est cherché à la racine du projet, ou via la variable d'env ACCOR_TOKENS_ZIP.
 */
import AdmZip from "adm-zip";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  alternativeOf,
  hexToRgb,
  rgbToHex,
  transformRgb,
} from "./lib/persona-color.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const zipPath =
  process.env.ACCOR_TOKENS_ZIP ?? join(root, "2.2.2_AccorDesignTokens_20261008_1001.zip");
const outDir = join(root, "tokens");

const PERSONAS = ["ours", "corneille", "libellule"];
const BREAKPOINTS = ["crossBpts", "desktopMD", "desktopSM", "tablet", "mobile"];
const MODES = ["light", "dark"];

if (!existsSync(zipPath)) {
  console.error(`✘ Zip introuvable : ${zipPath}`);
  console.error("  Place l'export Accor à la racine du projet ou définis ACCOR_TOKENS_ZIP.");
  process.exit(1);
}

const zip = new AdmZip(zipPath);
const readJson = (entry) => {
  const found = zip.getEntry(entry);
  if (!found) {
    console.error(`✘ ${entry} absent du zip`);
    process.exit(1);
  }
  return JSON.parse(zip.readAsText(found));
};

// ---------- outillage d'arbre ----------

const isToken = (node) => node && typeof node === "object" && node.$value !== undefined;

function walk(node, path, visit) {
  if (isToken(node)) return visit(path, node);
  if (node && typeof node === "object")
    for (const key of Object.keys(node)) walk(node[key], path ? `${path}.${key}` : key, visit);
}

/** Aplatit un arbre DTCG en Map chemin → token (les tokens sont clonés). */
function flatten(tree) {
  const flat = new Map();
  walk(tree, "", (p, t) => flat.set(p, { ...t }));
  return flat;
}

/** Reconstruit un arbre DTCG depuis une Map chemin → token. */
function unflatten(flat) {
  const tree = {};
  for (const [path, token] of flat) {
    const parts = path.split(".");
    let node = tree;
    for (const part of parts.slice(0, -1)) node = node[part] ??= {};
    node[parts.at(-1)] = token;
  }
  return tree;
}

const setValue = (flat, path, value) => {
  const token = flat.get(path);
  if (!token) throw new Error(`token absent : ${path}`);
  token.$value = value;
};

// ---------- renommage wel → ama ----------

const renamePath = (path) => path.replace(/^wel\./, "ama.");
const renameRefs = (value) =>
  typeof value === "string" ? value.replace(/\{wel\./g, "{ama.") : value;

function toAma(flat) {
  const out = new Map();
  for (const [path, token] of flat)
    out.set(renamePath(path), { ...token, $value: renameRefs(token.$value) });
  return out;
}

// ---------- alignement des chemins sur les noms de variables ----------

/**
 * Deux endroits où le chemin Accor ne donne pas le nom de variable émis :
 *
 *  - les primitives alpha, rangées sous `alpha.<opacité>.<famille>.<n>` alors
 *    que le CSS les nomme `alpha-<étiquette>-<opacité>` : l'ordre s'inverse, et
 *    la famille devient « white » ou « black » quand la base est un extrême ;
 *  - `leg.blueGrey.brandbook.96`, seul segment en un mot que le CSS coupe
 *    quand même en `brand-book`.
 *
 * On aligne les chemins sur la sortie CSS. Le nom de variable se déduit alors
 * du chemin sans aucune exception, ce qui est la condition pour que le
 * vérificateur puisse comparer mécaniquement.
 */
function pathAlignments(flat) {
  const renames = new Map();
  for (const [path, token] of flat) {
    const alpha = /^(ama\.prim\.color\.(?:leg\.)?alpha)\.(\d+)\.([A-Za-z]+)\.\d+$/.exec(path);
    if (alpha) {
      const [, prefix, opacity, family] = alpha;
      const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(String(token.$value));
      const base = rgb ? [+rgb[1], +rgb[2], +rgb[3]] : hexToRgb(String(token.$value));
      const label = base.every((c) => c === 255)
        ? "white"
        : base.every((c) => c === 0)
          ? "black"
          : family;
      renames.set(path, `${prefix}.${label}.${opacity}`);
      continue;
    }
    if (/\.brandbook\./.test(path)) renames.set(path, path.replace(".brandbook.", ".brandBook."));
  }

  const seen = new Set();
  for (const next of renames.values()) {
    if (seen.has(next) || (flat.has(next) && !renames.has(next)))
      throw new Error(`collision de renommage : ${next}`);
    seen.add(next);
  }
  return renames;
}

/** Applique une table de renommage aux chemins ET à toutes les références. */
function applyRenames(flat, renames) {
  const out = new Map();
  for (const [path, token] of flat) {
    const value =
      typeof token.$value === "string"
        ? token.$value.replace(/\{([^}]+)\}/g, (m, ref) => `{${renames.get(ref) ?? ref}}`)
        : token.$value;
    out.set(renames.get(path) ?? path, { ...token, $value: value });
  }
  return out;
}

// ---------- teinte persona ----------

const HEX = /^#([0-9a-fA-F]{3,8})$/;
const RGBA = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/;

/** Applique la teinte de l'avatar à une valeur de couleur littérale. */
function tintValue(value, rules) {
  const raw = String(value);

  const rgba = RGBA.exec(raw);
  if (rgba) {
    const [r, g, b] = transformRgb([+rgba[1], +rgba[2], +rgba[3]], rules);
    return rgba[4] === undefined ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${rgba[4]})`;
  }

  const hex = HEX.exec(raw);
  if (hex) {
    const digits = hex[1];
    const six = digits.length <= 4 ? digits.slice(0, 3).replace(/./g, (c) => c + c) : digits.slice(0, 6);
    const alpha = digits.length === 8 ? digits.slice(6) : digits.length === 4 ? digits[3].repeat(2) : "";
    return rgbToHex(transformRgb(hexToRgb(`#${six}`), rules)).toUpperCase() + alpha.toUpperCase();
  }

  return value;
}

function tintPrimitives(flat, rules) {
  const out = new Map();
  for (const [path, token] of flat) {
    out.set(
      path,
      token.$type === "color" && typeof token.$value === "string" && !token.$value.includes("{")
        ? { ...token, $value: tintValue(token.$value, rules) }
        : token,
    );
  }
  return out;
}

// ---------- corrections portées par AMa ----------

/**
 * Le paquet WDS installé donne au lien sombre survolé une couleur PLUS SOMBRE
 * qu'au repos, et à l'état pressé une couleur d'une autre famille. L'export
 * 2.2.2 corrige les deux ; le site tourne encore sur le paquet installé.
 *
 * Le critère du chantier est la non-régression stricte : on réaligne donc la
 * chaîne ama sur ce que le site affiche, par un simple ré-aliasage vers les
 * primitives correspondantes — aucune valeur littérale n'est introduite. À
 * lever au profit des valeurs 2.2.2 lors de la réécriture des composants.
 */
const PINNED_TO_PRODUCTION = {
  "ama.web.bSem.color.dark.hover.link": "{ama.prim.color.tropos.49}",
  "ama.web.bSem.color.dark.pressed.link": "{ama.prim.color.royalBlue.65}",
};

/**
 * `surface-alternative` vaut `surface` en sombre dans l'export Accor : la barre
 * de navigation ne s'y détacherait que par son ombre. build-themes.mjs dérive
 * une nuance à l'écart de contraste du mode clair (1,076) ; on introduit ici la
 * primitive correspondante, seule valeur authorée par AMa dans tout l'export.
 *
 * Son numéro suit la convention des familles Accor : la clarté L* CIE.
 */
const DARK_SURFACE_PRIMITIVE = "ama.prim.color.navalGrey.6";

const Lstar = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return y <= 216 / 24389 ? (y * 24389) / 27 : Math.cbrt(y) * 116 - 16;
};

// ---------- fontStyles ----------

/**
 * Le theme.css émet des variables `font-styles` que l'export Accor ne porte pas
 * — elles n'existent que dans le générateur CSS. On les rétablit comme tokens,
 * en calquant l'arborescence de `fontWeights` : mêmes feuilles, donc mêmes noms
 * de variables. Seuls les sous-titres du système sont en italique.
 */
function addFontStyles(brand, cross) {
  const leaves = [...brand.keys()].filter((p) => p.startsWith("ama.web.bSem.fontWeights."));
  for (const path of leaves) {
    const target = path.replace(".fontWeights.", ".fontStyles.");
    brand.set(target, {
      $type: "fontStyles",
      $value: /\.subtitle\./.test(path) ? "italic" : "normal",
      $description: "Font style (normal or italic).",
    });
  }
  brand.set("ama.web.bComp.btn.label-fontStyles", {
    $type: "fontStyles",
    $value: "normal",
    $description: "Button label font style.",
  });

  for (const path of [...cross.keys()].filter((p) => p.startsWith("ama.sem.fontWeights."))) {
    const target = path.replace(".fontWeights.", ".fontStyles.");
    cross.set(target, {
      $type: "fontStyles",
      $value: `{${target.replace("ama.sem.", "ama.web.bSem.")}}`,
      $description: "Font style (normal or italic).",
    });
  }
  cross.set("ama.comp.btn.label-fontStyles", {
    $type: "fontStyles",
    $value: "{ama.web.bComp.btn.label-fontStyles}",
    $description: "Button label font style.",
  });
}

// ---------- overrides de l'avatar ----------

/** ama.sem.color.on-surface-hi → wel-sem-color-on-surface-hi */
const varName = (path) =>
  path
    .replace(/^ama\./, "wel-")
    .replace(/\./g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

/** « 1.2rem » → 19.2 · « 4px » → 4 · « 0 » → 0 — l'unité des tokens est le pixel. */
function cssLengthToNumber(value) {
  const m = /^(-?[\d.]+)(rem|px)?$/.exec(String(value).trim());
  if (!m) throw new Error(`valeur d'override non numérique : ${value}`);
  return m[2] === "rem" ? Number(m[1]) * 16 : Number(m[1]);
}

/**
 * Reporte les overrides du mapping persona — écrits en motifs de variables CSS
 * pour build-themes.mjs — sur la couche d'alias de la marque.
 *
 * On part des tokens publics (sem/comp) dont le nom de variable correspond au
 * motif, puis on remonte d'un cran leur alias pour écrire dans bSem/bComp. La
 * valeur reste ainsi authorée à un seul endroit, et les deux pipelines partent
 * littéralement de la même liste.
 */
function applyOverrides(brand, publicSets, vars) {
  if (!vars) return;
  for (const [pattern, value] of Object.entries(vars)) {
    const rx = new RegExp(`^${pattern.replace(/^--/, "").replace(/\*/g, "[a-z0-9-]*")}$`);
    const targets = new Set();

    for (const flat of publicSets) {
      for (const [path, token] of flat) {
        if (!rx.test(varName(path))) continue;
        const alias = /^\{([^}]+)\}$/.exec(String(token.$value));
        if (!alias) throw new Error(`${path} n'est pas un alias pur, override impossible`);
        targets.add(alias[1]);
      }
    }

    if (!targets.size) {
      console.warn(`  ⚠ override sans cible : ${pattern}`);
      continue;
    }
    for (const target of targets) setValue(brand, target, cssLengthToNumber(value));
  }
}

// ---------- construction ----------

const raw = {
  primNumbers: toAma(flatten(readJson("primitives/numbers.json"))),
  primColors: toAma(flatten(readJson("primitives/all.json"))),
  brand: toAma(flatten(readJson("brands/brandbook.json"))),
  modes: Object.fromEntries(
    MODES.map((m) => [m, toAma(flatten(readJson(`colorModes/${m}.json`)))]),
  ),
  breakpoints: Object.fromEntries(
    BREAKPOINTS.map((b) => [b, toAma(flatten(readJson(`breakpoints/${b}.json`)))]),
  ),
};

// les chemins réalignés valent pour les définitions comme pour les références :
// la table est calculée sur les primitives, puis appliquée à tous les sets.
const renames = pathAlignments(raw.primColors);
const align = (flat) => applyRenames(flat, renames);

const source = {
  primNumbers: align(raw.primNumbers),
  primColors: align(raw.primColors),
  brand: align(raw.brand),
  modes: Object.fromEntries(MODES.map((m) => [m, align(raw.modes[m])])),
  breakpoints: Object.fromEntries(BREAKPOINTS.map((b) => [b, align(raw.breakpoints[b])])),
};
console.log(`${renames.size} chemin(s) réalignés sur les noms de variables CSS`);

// la primitive du surface-alternative sombre, dérivée du surface sombre Accor
const darkSurfaceRef = /^\{([^}]+)\}$/.exec(
  String(source.brand.get("ama.web.bSem.color.dark.surface").$value),
)[1];
const darkSurfaceHex = String(source.primColors.get(darkSurfaceRef).$value);
const darkAlternativeHex = alternativeOf(darkSurfaceHex).toUpperCase();

if (Math.round(Lstar(darkAlternativeHex)) !== Number(DARK_SURFACE_PRIMITIVE.split(".").at(-1)))
  throw new Error(
    `${DARK_SURFACE_PRIMITIVE} ne correspond plus à sa clarté L* (${Lstar(darkAlternativeHex).toFixed(1)})`,
  );

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, "primitives"), { recursive: true });
mkdirSync(join(outDir, "brands"), { recursive: true });
mkdirSync(join(outDir, "colorModes"), { recursive: true });
mkdirSync(join(outDir, "breakpoints"), { recursive: true });

const write = (rel, flat) =>
  writeFileSync(join(outDir, `${rel}.json`), `${JSON.stringify(unflatten(flat), null, 2)}\n`);

write("primitives/numbers", source.primNumbers);

/** Sert à prouver que les couches publiques ne dépendent pas de l'avatar. */
const publicReference = new Map();
let publicLayersOut;

for (const persona of PERSONAS) {
  const mapping = JSON.parse(
    readFileSync(join(root, "personas", "mappings", `${persona}.map.json`), "utf8"),
  );
  const rules = mapping.colors ?? {};
  console.log(`— ${persona}`);

  // 1. primitives teintées, plus celle qu'AMa ajoute pour le mode sombre
  const primitives = tintPrimitives(source.primColors, rules);
  primitives.set(DARK_SURFACE_PRIMITIVE, {
    $type: "color",
    $value: tintValue(darkAlternativeHex, rules),
    $description: "Alternative dark surface. Usage: navigation bar and footer over the page surface.",
  });

  // 2. couche d'alias de la marque
  const brand = new Map([...source.brand].map(([p, t]) => [p, { ...t }]));
  for (const [path, value] of Object.entries(PINNED_TO_PRODUCTION)) setValue(brand, path, value);
  setValue(brand, "ama.web.bSem.color.dark.surface-alternative", `{${DARK_SURFACE_PRIMITIVE}}`);

  for (const [path, token] of brand) {
    if (token.$type !== "fontFamilies") continue;
    const replacement = mapping.fonts?.[token.$value];
    if (replacement) token.$value = replacement;
  }

  // 3. couches publiques, communes aux avatars
  const modes = Object.fromEntries(
    MODES.map((m) => [m, new Map([...source.modes[m]].map(([p, t]) => [p, { ...t }]))]),
  );
  const breakpoints = Object.fromEntries(
    BREAKPOINTS.map((b) => [b, new Map([...source.breakpoints[b]].map(([p, t]) => [p, { ...t }]))]),
  );
  addFontStyles(brand, breakpoints.crossBpts);

  applyOverrides(brand, [...Object.values(modes), ...Object.values(breakpoints)], mapping.vars);

  write(`primitives/${persona}`, primitives);
  write(`brands/${persona}`, brand);
  console.log(`  ✔ primitives/${persona}.json (${primitives.size} tokens)`);
  console.log(`  ✔ brands/${persona}.json (${brand.size} tokens)`);

  // Les couches publiques sont agnostiques de l'avatar : c'est ce qui permet de
  // n'en écrire qu'un seul jeu. L'invariant est vérifié plutôt que supposé —
  // un override qui viserait par erreur un token sem/comp le romprait en
  // silence, et les trois avatars ne partageraient plus le même contrat.
  const publicLayers = { ...modes, ...breakpoints };
  for (const [name, flat] of Object.entries(publicLayers)) {
    const dump = JSON.stringify(unflatten(flat));
    if (!publicReference.has(name)) publicReference.set(name, { persona, dump });
    else if (publicReference.get(name).dump !== dump)
      throw new Error(
        `la couche publique « ${name} » diffère entre ${publicReference.get(name).persona} et ${persona}`,
      );
  }
  publicLayersOut = publicLayers;
}

for (const m of MODES) write(`colorModes/${m}`, publicLayersOut[m]);
for (const b of BREAKPOINTS) write(`breakpoints/${b}`, publicLayersOut[b]);
console.log(
  `\n✔ couches publiques identiques pour les ${PERSONAS.length} avatars (${MODES.length + BREAKPOINTS.length} sets)`,
);

// ---------- métadonnées Tokens Studio ----------

const tokenSetOrder = [
  "primitives/numbers",
  ...PERSONAS.map((p) => `primitives/${p}`),
  ...PERSONAS.map((p) => `brands/${p}`),
  ...MODES.map((m) => `colorModes/${m}`),
  ...BREAKPOINTS.map((b) => `breakpoints/${b}`),
];
writeFileSync(join(outDir, "$metadata.json"), `${JSON.stringify({ tokenSetOrder }, null, 2)}\n`);

const BREAKPOINT_LABELS = {
  desktopMD: "desktop-md (1280-1439)",
  desktopSM: "desktop-sm (1024-1279)",
  tablet: "tablet (768-1023)",
  mobile: "mobile (320-767)",
};

const themes = [
  ...PERSONAS.map((p) => ({
    id: `brand-${p}`,
    name: p,
    group: "brands",
    selectedTokenSets: {
      "primitives/numbers": "source",
      [`primitives/${p}`]: "source",
      [`brands/${p}`]: "enabled",
    },
  })),
  ...MODES.map((m) => ({
    id: `mode-${m}`,
    name: m,
    group: "colorModes",
    selectedTokenSets: { [`colorModes/${m}`]: "enabled" },
  })),
  ...BREAKPOINTS.filter((b) => b !== "crossBpts").map((b) => ({
    id: `breakpoint-${b}`,
    name: BREAKPOINT_LABELS[b],
    group: "breakpoints",
    selectedTokenSets: {
      "breakpoints/crossBpts": "enabled",
      [`breakpoints/${b}`]: "enabled",
    },
  })),
];
writeFileSync(join(outDir, "$themes.json"), `${JSON.stringify(themes, null, 2)}\n`);

console.log(`\n✔ $metadata.json (${tokenSetOrder.length} sets) · $themes.json (${themes.length} thèmes)`);
console.log("→ tokens/ construit. Vérifier avec : npm run tokens:check");
