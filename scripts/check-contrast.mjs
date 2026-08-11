/**
 * Audit de contraste des thèmes générés (WCAG 2.1, niveau AA).
 *
 * Les thèmes sont produits par transformation de teinte du template WDS. Cette
 * transformation ramène chaque couleur à la luminance relative de l'originale,
 * donc les contrastes du système sont préservés par construction — ce script
 * le vérifie, et échoue si une paire texte/fond passe sous le seuil.
 *
 * Gère les cas que l'œil ne rattrape pas : fonds en dégradé (les deux extrémités
 * sont évaluées) et fonds semi-transparents (composés sur la surface).
 *
 * Usage : npm run a11y:contrast
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PERSONAS = ["ours", "corneille", "libellule"];
const MODES = ["light", "dark"];

// Seuil AA pour du texte normal. Le texte large (≥ 18.66px gras ou ≥ 24px)
// tolère 3:1, mais aucune des paires ci-dessous n'est exclusivement large.
const AA = 4.5;

const PAIRS = [
  ["Bouton primaire", "--wel-comp-btn-primary-fg-color", "--wel-comp-btn-primary-bg-color"],
  ["Bouton secondaire", "--wel-comp-btn-secondary-fg-color", "--wel-comp-btn-secondary-bg-color"],
  ["Bouton tertiaire", "--wel-comp-btn-tertiary-fg-color", "--wel-comp-btn-tertiary-bg-color"],
  ["Chip", "--wel-comp-chip-fg-color", "--wel-comp-chip-bg-color"],
  ["Chip sélectionné", "--wel-comp-chip-fg-color", "--wel-comp-chip-selected-bg-color"],
  ["Pastille question", "--wel-sem-color-on-primary", "--wel-sem-color-primary"],
  ["Texte principal", "--wel-sem-color-on-surface-hi", "--wel-sem-color-surface"],
  ["Texte secondaire", "--wel-sem-color-on-surface-mid", "--wel-sem-color-surface"],
  ["Texte tertiaire", "--wel-sem-color-on-surface-low", "--wel-sem-color-surface"],
  ["Lien", "--wel-sem-color-link", "--wel-sem-color-surface"],
];

function blocks(css) {
  const out = { base: {}, light: {}, dark: {} };
  const re = /\[data-persona="[^"]+"\](\[data-color-mode="(light|dark)"\])?\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const target = m[2] ?? "base";
    for (const d of m[3].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[target][d[1]] = d[2].trim();
  }
  return out;
}

function rgba(v) {
  if (!v) return null;
  v = v.trim();
  let m = v.match(/^#([0-9a-f]{8})$/i);
  if (m) {
    const p = [0, 2, 4, 6].map((i) => parseInt(m[1].slice(i, i + 2), 16));
    return [p[0], p[1], p[2], p[3] / 255];
  }
  m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) return [...[0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)), 1];
  m = v.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  return null;
}

const over = (fg, bg) => [0, 1, 2].map((i) => Math.round(fg[i] * fg[3] + bg[i] * (1 - fg[3])));
const lin = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const failures = [];
const lines = [];

for (const persona of PERSONAS) {
  const b = blocks(readFileSync(join(root, "styles", "generated", `${persona}.css`), "utf8"));
  for (const mode of MODES) {
    const token = (t) => b[mode][t] ?? b.base[t];
    const surface = rgba(token("--wel-sem-color-surface")) ?? [255, 255, 255, 1];
    for (const [label, fgToken, bgToken] of PAIRS) {
      const fg = rgba(token(fgToken));
      const bgRaw = token(bgToken);
      if (!fg || !bgRaw) continue;

      // Un dégradé n'est conforme que si ses deux extrémités le sont.
      const stops = /gradient/i.test(bgRaw)
        ? (bgRaw.match(/#[0-9a-f]{6,8}|rgba?\([^)]+\)/gi) ?? []).map(rgba).filter(Boolean)
        : [rgba(bgRaw)].filter(Boolean);
      if (!stops.length) continue;

      const worst = Math.min(
        ...stops.map((s) => {
          const solid = over(s, surface);
          return ratio(over(fg, solid), solid);
        }),
      );
      const ok = worst >= AA;
      lines.push(
        `  ${ok ? "✔" : "✘"} ${label.padEnd(19)} ${worst.toFixed(2)}:1`,
      );
      if (!ok) failures.push({ persona, mode, label, ratio: worst, fg: token(fgToken), bg: bgRaw });
    }
    lines.splice(lines.length - PAIRS.length, 0, `\n${persona} / ${mode}`);
  }
}

console.log(lines.join("\n"));

if (failures.length) {
  console.error(`\n✘ ${failures.length} paire(s) sous le seuil AA (${AA}:1) :\n`);
  for (const f of failures) {
    console.error(`  ${f.persona} / ${f.mode} — ${f.label} : ${f.ratio.toFixed(2)}:1`);
    console.error(`    ${f.fg} sur ${f.bg}`);
  }
  process.exit(1);
}

console.log(`\n✔ Toutes les paires atteignent AA (${AA}:1) sur 3 personas × 2 modes.`);
