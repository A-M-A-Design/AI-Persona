/**
 * Génère les 3 thèmes persona à partir du theme.css WDS de référence
 * (styles/welds-src/template.theme.css, gitignoré) et des mappings
 * personas/mappings/<id>.map.json.
 *
 * Principe : le template est 100 % aplati (aucun var() interne), on transforme
 * donc chaque littéral de couleur via des règles de teinte HSL (la luminance
 * n'est jamais modifiée → les contrastes light/dark du système sont préservés),
 * on remplace les familles de polices, on applique des overrides de variables,
 * puis on rescope :root → [data-persona="<id>"].
 *
 * Usage : npm run themes:build
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = join(root, "styles", "welds-src", "template.theme.css");
const outDir = join(root, "styles", "generated");
const PERSONAS = ["ours", "corneille", "libellule"];

if (!existsSync(templatePath)) {
  console.error("✘ template absent — lancer d'abord : npm run welds:install");
  process.exit(1);
}

// ---------- couleur : hex/rgba <-> hsl ----------

function rgbToHsl(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}

/**
 * Applique les règles du persona à un triplet RGB.
 * Règles ("hueRules") évaluées dans l'ordre, première qui matche gagne :
 *  - { "from": [a, b], "to": t, "saturate": k } : si la teinte ∈ [a,b] (cercle),
 *    elle devient t (± son écart au centre de la plage, pour garder la variété),
 *    saturation × k.
 *  - { "maxSat": s, "tintHue": t, "tintSat": v } : couleurs quasi neutres
 *    (S ≤ maxSat) teintées vers t avec S portée à v minimum.
 * "saturateAll" : multiplicateur global de saturation appliqué à la fin.
 */
function transformRgb([r, g, b], rules) {
  let [h, s, l] = rgbToHsl(r, g, b);
  for (const rule of rules.hueRules ?? []) {
    if (rule.maxSat !== undefined) {
      if (s <= rule.maxSat && l > 0.02 && l < 0.98) {
        h = rule.tintHue;
        s = Math.max(s, rule.tintSat ?? s);
        break;
      }
    } else {
      const [a, bnd] = rule.from;
      const inRange = a <= bnd ? h >= a && h <= bnd : h >= a || h <= bnd;
      if (inRange && s > (rule.minSat ?? 0.08)) {
        const center = a <= bnd ? (a + bnd) / 2 : ((a + bnd + 360) / 2) % 360;
        let delta = h - center;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        h = rule.to + delta * (rule.spread ?? 0.25);
        if (rule.saturate) s = Math.min(1, s * rule.saturate);
        break;
      }
    }
  }
  if (rules.saturateAll) s = Math.min(1, s * rules.saturateAll);
  return hslToRgb(h, s, l);
}

const hex2 = (v) => v.toString(16).padStart(2, "0");

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
  return css.replace(/(--wel-[a-z0-9-]*font-famil[a-z-]*:\s*)([^;]+)(;)/g, (m, pre, value, post) => {
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
  let css = template;
  css = transformColors(css, mapping.colors ?? {});
  css = transformFonts(css, mapping.fonts);
  css = applyVarOverrides(css, mapping.vars);
  css = rescope(css, id);
  const header = `/* GÉNÉRÉ par scripts/build-themes.mjs — ne pas éditer à la main.\n   Persona "${id}" : valeurs personnelles dérivées du contrat --wel-*. */\n`;
  writeFileSync(join(outDir, `${id}.css`), header + css);
  console.log(`  ✔ styles/generated/${id}.css (${Math.round(css.length / 1024)} KB)`);
}

console.log("\n→ Thèmes générés. Ils sont committables (valeurs personnelles).");
