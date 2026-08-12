/**
 * Génère les 3 thèmes persona à partir du theme.css WDS de référence
 * (styles/welds-src/template.theme.css, gitignoré) et des mappings
 * personas/mappings/<id>.map.json.
 *
 * Principe : le template est 100 % aplati (aucun var() interne), on transforme
 * donc chaque littéral de couleur via des règles de teinte HSL, on remplace les
 * familles de polices, on applique des overrides de variables, puis on rescope
 * :root → [data-persona="<id>"].
 *
 * Chaque couleur transformée est ramenée à la luminance relative WCAG de la
 * couleur d'origine : les ratios de contraste du système sont donc préservés
 * par construction, pour toutes les paires texte/fond à la fois. Vérifiable
 * avec `npm run a11y:contrast`.
 *
 * La transformation elle-même vit dans scripts/lib/persona-color.mjs, partagée
 * avec le générateur de l'export de tokens AMa.
 *
 * Usage : npm run themes:build
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SURFACE_ALTERNATIVE_LIGHT,
  alternativeOf,
  hex2,
  transformRgb,
} from "./lib/persona-color.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = join(root, "styles", "welds-src", "template.theme.css");
const outDir = join(root, "styles", "generated");
const PERSONAS = ["ours", "corneille", "libellule"];

if (!existsSync(templatePath)) {
  console.error("✘ template absent — lancer d'abord : npm run welds:install");
  process.exit(1);
}

// ---------- couleurs ----------

function transformColors(css, rules) {
  // hex 6 ou 8 digits (l'alpha est préservé tel quel)
  css = css.replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\b/g, (_, rgb, alpha) => {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(rgb.slice(i, i + 2), 16));
    const [nr, ng, nb] = transformRgb([r, g, b], rules);
    return `#${hex2(nr)}${hex2(ng)}${hex2(nb)}${alpha ?? ""}`;
  });
  // hex 3/4 digits
  css = css.replace(/#([0-9a-fA-F]{3})([0-9a-fA-F])?\b/g, (m, rgb, alpha) => {
    const [r, g, b] = rgb.split("").map((c) => parseInt(c + c, 16));
    const [nr, ng, nb] = transformRgb([r, g, b], rules);
    return `#${hex2(nr)}${hex2(ng)}${hex2(nb)}${alpha ? alpha + alpha : ""}`;
  });
  // rgba()/rgb()
  css = css.replace(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)/g,
    (_, r, g, b, a) => {
      const [nr, ng, nb] = transformRgb([+r, +g, +b], rules);
      return a ? `rgba(${nr},${ng},${nb}${a})` : `rgb(${nr},${ng},${nb})`;
    },
  );
  return css;
}

// ---------- fontes et overrides ----------

function transformFonts(css, fonts) {
  if (!fonts) return css;
  return css.replace(/(--ama-[a-z0-9-]*font-famil[a-z-]*:\s*)([^;]+)(;)/g, (m, pre, value, post) => {
    let v = value;
    for (const [from, to] of Object.entries(fonts)) {
      v = v.replace(new RegExp(`(['"]?)${from}\\1`, "g"), to);
    }
    return pre + v + post;
  });
}

function applyVarOverrides(css, vars) {
  if (!vars) return css;
  for (const [pattern, value] of Object.entries(vars)) {
    const rx = new RegExp(
      `(${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[a-z0-9-]*")}:\\s*)[^;]+;`,
      "g",
    );
    const before = css;
    css = css.replace(rx, `$1${value};`);
    if (css === before) console.warn(`  ⚠ override sans effet : ${pattern}`);
  }
  return css;
}

// ---------- tokens absents du template ----------

/**
 * Ajoute `--wel-sem-color-surface-alternative`, absent du theme.css livré par le
 * paquet WDS installé ici. Voir scripts/lib/persona-color.mjs pour la dérivation.
 *
 * L'injection a lieu avant la teinte persona, qui préserve la luminance
 * relative : le pas de 1,076 vaut donc pour les trois personas.
 */
function addSurfaceAlternative(css) {
  return css.replace(
    /(--wel-sem-color-surface:\s*(#[0-9a-fA-F]{3,8})\s*;)/g,
    (line, _all, value) => {
      // Le blanc est neutre : la recherche à teinte constante rendrait un gris,
      // là où le système pose une nuance teintée. On garde donc sa valeur.
      const alt =
        value.toLowerCase() === "#ffffff" ? SURFACE_ALTERNATIVE_LIGHT : alternativeOf(value);
      return `${line}\n--wel-sem-color-surface-alternative: ${alt};`;
    },
  );
}

// ---------- contrat --ama-* ----------

/**
 * Renomme les déclarations du template en `--ama-*`. Seules les déclarations
 * sont touchées : les rares valeurs contenant un `var()` visent les polices
 * (`--font-<persona>-*`), jamais une variable du contrat.
 *
 * Les composants WDS consommaient `var(--wel-…)` en dur ; ils sont désormais
 * alignés sur `--ama-*` par `scripts/install-welds.mjs`, à l'extraction. Plus
 * rien ne consomme `--wel-*`, d'où l'absence de couche d'alias — elle aurait
 * pesé 358 Ko pour les trois personas.
 */
function renameToAma(css) {
  return css.replace(/(^|\n)([ \t]*)--wel-([a-z0-9-]+):/g, "$1$2--ama-$3:");
}

// ---------- rescope ----------

function rescope(css, id) {
  return css
    .replace(/:root\b/g, `[data-persona="${id}"]`)
    .replace(/\[data-color-mode="(dark|light)"\]/g, `[data-persona="${id}"][data-color-mode="$1"]`);
}

// ---------- build ----------

const template = readFileSync(templatePath, "utf8");
mkdirSync(outDir, { recursive: true });

for (const id of PERSONAS) {
  const mapping = JSON.parse(
    readFileSync(join(root, "personas", "mappings", `${id}.map.json`), "utf8"),
  );
  console.log(`— ${id}`);
  let css = addSurfaceAlternative(template);
  css = transformColors(css, mapping.colors ?? {});
  css = renameToAma(css);
  css = transformFonts(css, mapping.fonts);
  // après le renommage : les overrides du mapping visent la source, et l'alias
  // les suit tout seul puisqu'il pointe dessus.
  css = applyVarOverrides(css, mapping.vars);
  css = rescope(css, id);
  const header =
    `/* GÉNÉRÉ par scripts/build-themes.mjs — ne pas éditer à la main.\n` +
    `   Persona "${id}" : valeurs personnelles dérivées du contrat --ama-*. */\n`;
  writeFileSync(join(outDir, `${id}.css`), header + css);
  console.log(`  ✔ styles/generated/${id}.css (${Math.round(css.length / 1024)} KB)`);
}

console.log("\n→ Thèmes générés. Ils sont committables (valeurs personnelles).");
