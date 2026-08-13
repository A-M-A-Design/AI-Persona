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

// Seuil des éléments non textuels — WCAG 1.4.11. L'anneau de focus en relève :
// c'est un indicateur graphique, pas du texte.
const AA_NON_TEXTE = 3;

// `exempt` : WCAG 1.4.3 exclut les composants inactifs du critère de contraste.
// On les mesure quand même — un état désactivé illisible reste un problème
// d'usage — mais sans faire échouer l'audit.
// `seuil` : abaisse le seuil pour les paires non textuelles.
const PAIRS = [
  ["Bouton primaire", "--ama-comp-btn-primary-fg-color", "--ama-comp-btn-primary-bg-color"],
  ["Bouton primaire · survol", "--ama-comp-btn-primary-hover-fg-color", "--ama-comp-btn-primary-hover-bg-color"],
  ["Bouton primaire · pressé", "--ama-comp-btn-primary-pressed-fg-color", "--ama-comp-btn-primary-pressed-bg-color"],
  // L'état inactif ne suit plus le WDS : styles/persona-extras.css garde le
  // libellé opaque et rend le fond translucide (24 % de la primaire). Le seuil
  // s'applique donc, alors que WCAG 1.4.3 exempterait ce composant.
  ["Bouton inactif", "--ama-sem-color-on-surface-hi", "--ama-sem-color-primary", { alpha: 0.24 }],
  ["Bouton secondaire", "--ama-comp-btn-secondary-fg-color", "--ama-comp-btn-secondary-bg-color"],
  ["Bouton secondaire · survol", "--ama-comp-btn-secondary-hover-fg-color", "--ama-comp-btn-secondary-hover-bg-color"],
  ["Bouton tertiaire", "--ama-comp-btn-tertiary-fg-color", "--ama-comp-btn-tertiary-bg-color"],
  ["Chip", "--ama-comp-chip-fg-color", "--ama-comp-chip-bg-color"],
  ["Chip sélectionné", "--ama-comp-chip-fg-color", "--ama-comp-chip-selected-bg-color"],
  ["Pastille question", "--ama-sem-color-on-primary", "--ama-sem-color-primary"],
  ["Texte principal", "--ama-sem-color-on-surface-hi", "--ama-sem-color-surface"],
  ["Texte secondaire", "--ama-sem-color-on-surface-mid", "--ama-sem-color-surface"],
  ["Texte tertiaire", "--ama-sem-color-on-surface-low", "--ama-sem-color-surface"],
  ["Lien", "--ama-sem-color-link", "--ama-sem-color-surface"],
  // Le texte qu'on tape, et la valeur d'un select : ils ne reposent pas sur
  // `surface` mais sur leur propre fond, qui n'était pas mesuré.
  ["Champ de saisie", "--ama-sem-color-on-surface-hi", "--ama-sem-color-surface-container-low"],
  /*
    L'indice de saisie. Il gardait la valeur par défaut du navigateur —
    `rgb(117, 117, 117)` — soit **3,86:1 sur le panneau du lanceur**, sous le
    seuil AA. Cette couleur n'étant pas un token, aucune paire ne la couvrait :
    le trou était dans la liste, pas dans le calcul. Il est désormais déclaré,
    et mesuré ici.
  */
  ["Indice de saisie", "--ama-sem-color-on-surface-mid", "--ama-sem-color-surface-container-low"],

  // L'anneau de focus, sur les trois fonds où il se pose. Mesuré le
  // 2026-08-13 en basculant le CSS sur les tokens `focus.outline-*` : le token
  // `focus` tient partout, au pire 3,99:1.
  //
  // **`focus-fallback` n'est donc pas employé**, et il ne doit pas l'être par
  // principe : la mesure le donne à **2,88:1 sur `surface-alternative` en mode
  // sombre**, sous le seuil que le token `focus` franchit. Il existe pour des
  // fonds colorés où le token principal échoue ; la palette de ce site n'en
  // présente aucun. Les deux lignes ci-dessous le vérifient plutôt que de le
  // supposer — le jour où la palette bouge, c'est ici qu'on le verra.
  ["Anneau de focus · page", "--ama-sem-color-focus", "--ama-sem-color-surface", { seuil: AA_NON_TEXTE }],
  ["Anneau de focus · barre", "--ama-sem-color-focus", "--ama-sem-color-surface-alternative", { seuil: AA_NON_TEXTE }],
  ["Anneau de focus · primaire", "--ama-sem-color-focus", "--ama-sem-color-primary", { seuil: AA_NON_TEXTE }],
];

// Le contenu des cards article repose sur un voile posé au-dessus d'une image.
// Le fond n'est donc pas un token : on évalue le pire cas, une image blanche
// sous le voile. Ces paires résolvent toujours les valeurs du mode sombre, le
// voile étant foncé quel que soit le mode de la page (cf. ArticleCard).
const VEIL = { color: [7, 5, 24], alpha: 0.6 };
const CARD_PAIRS = [
  ["Card · titre", "--ama-sem-color-on-surface-hi"],
  // La maquette lie le surtitre à on-surface-low (2,21:1 ici) ; on-surface-hi
  // est le seul palier conforme sans épaissir le voile — cf. app/globals.css.
  ["Card · surtitre", "--ama-sem-color-on-surface-hi"],
  // Même situation pour le héro de la v2 : titre et accroche posés sur le
  // voile fort de l'illustration du persona, en mode sombre forcé. L'accroche
  // visait on-surface-mid et tombait à 3,18:1 sur les trois personas — même
  // arbitrage que le surtitre de card, la hiérarchie passant par la taille.
  ["Slideshow · titre", "--ama-sem-color-on-surface-hi"],
  ["Slideshow · accroche", "--ama-sem-color-on-surface-hi"],
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

/**
 * APCA 0.1.9 — le contraste perceptuel qui doit remplacer le ratio WCAG dans
 * WCAG 3. Mesuré **en parallèle**, jamais bloquant : WCAG 3 n'est pas ratifié
 * et APCA est encore en phase de finalisation. C'est la recommandation de
 * l'article de Kortic du 2026-04-18, et c'est la seule posture tenable — on ne
 * fait pas échouer une CI sur un brouillon.
 *
 * Ce qu'il apporte ici, et que le ratio ne dit pas :
 *
 * - **la polarité compte**. Le ratio est symétrique — inverser texte et fond ne
 *   change rien. APCA, non : du clair sur du sombre et du sombre sur du clair
 *   ne se lisent pas pareil. Ce site a les deux, et des surfaces qui basculent
 *   d'un mode à l'autre.
 * - **la typographie compte**. Un titre de 32 px gras et une légende de 12 px
 *   passent le même seuil en WCAG 2. Les seuils APCA usuels : Lc 75 pour du
 *   texte courant de 16 px, Lc 60 pour du 24 px gras, Lc 30 pour du décoratif.
 *
 * Renvoie une valeur signée de -108 à +106. Le signe dit la polarité, sa
 * valeur absolue la lisibilité.
 */
function apcaLc(txt, bg) {
  const Y = ([r, g, b]) =>
    (r / 255) ** 2.4 * 0.2126729 + (g / 255) ** 2.4 * 0.7151522 + (b / 255) ** 2.4 * 0.072175;
  // Les noirs profonds sont adoucis : l'œil n'y distingue plus rien, et sans ce
  // rattrapage la formule y produirait des écarts qui n'existent pas.
  const clamp = (y) => (y < 0.022 ? y + (0.022 - y) ** 1.414 : y);

  const Ytxt = clamp(Y(txt));
  const Ybg = clamp(Y(bg));
  if (Math.abs(Ybg - Ytxt) < 0.0005) return 0;

  let sapc;
  let lc;
  if (Ybg > Ytxt) {
    // Sombre sur clair.
    sapc = (Ybg ** 0.56 - Ytxt ** 0.57) * 1.14;
    lc = sapc < 0.1 ? 0 : sapc - 0.027;
  } else {
    // Clair sur sombre.
    sapc = (Ybg ** 0.65 - Ytxt ** 0.62) * 1.14;
    lc = sapc > -0.1 ? 0 : sapc + 0.027;
  }
  return lc * 100;
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
const apca = [];
const lines = [];

for (const persona of PERSONAS) {
  const b = blocks(readFileSync(join(root, "styles", "generated", `${persona}.css`), "utf8"));
  for (const mode of MODES) {
    const token = (t) => b[mode][t] ?? b.base[t];
    const surface = rgba(token("--ama-sem-color-surface")) ?? [255, 255, 255, 1];
    for (const [label, fgToken, bgToken, opts = {}] of PAIRS) {
      const fg = rgba(token(fgToken));
      const bgRaw = token(bgToken);
      if (!fg || !bgRaw) continue;

      // `alpha` : le fond est appliqué en translucide sur la surface (cas des
      // états inactifs, cf. styles/persona-extras.css).
      const op = opts.alpha ?? 1;

      // Un dégradé n'est conforme que si ses deux extrémités le sont.
      const stops = /gradient/i.test(bgRaw)
        ? (bgRaw.match(/#[0-9a-f]{6,8}|rgba?\([^)]+\)/gi) ?? []).map(rgba).filter(Boolean)
        : [rgba(bgRaw)].filter(Boolean);
      if (!stops.length) continue;

      const worst = Math.min(
        ...stops.map((s) => {
          const solid = over([s[0], s[1], s[2], s[3] * op], surface);
          return ratio(over(fg, solid), solid);
        }),
      );
      // Même pire cas, mesuré à l'autre algorithme.
      const lc = stops
        .map((s) => {
          const solid = over([s[0], s[1], s[2], s[3] * op], surface);
          return apcaLc(over(fg, solid), solid);
        })
        .reduce((a, b) => (Math.abs(a) < Math.abs(b) ? a : b));
      // `seuil` abaissé = paire non textuelle (l'anneau de focus). APCA lui
      // demande Lc 15 à 30, pas les 75 d'un texte courant.
      apca.push({ persona, mode, label, lc, texte: (opts.seuil ?? AA) >= AA });

      const ok = worst >= (opts.seuil ?? AA);
      const mark = ok ? "✔" : opts.exempt ? "·" : "✘";
      lines.push(
        `  ${mark} ${label.padEnd(26)} ${worst.toFixed(2)}:1  Lc ${lc.toFixed(0).padStart(4)}${opts.exempt && !ok ? "  (inactif — hors critère AA)" : ""}`,
      );
      if (!ok && !opts.exempt) {
        failures.push({ persona, mode, label, ratio: worst, fg: token(fgToken), bg: bgRaw });
      }
    }
    lines.splice(lines.length - PAIRS.length, 0, `\n${persona} / ${mode}`);
  }

  // Cards article : évaluées une fois par persona (valeurs du mode sombre),
  // sur le pire fond possible — une image blanche sous le voile.
  const darkToken = (t) => b.dark[t] ?? b.base[t];
  const veilOnWhite = over([...VEIL.color, VEIL.alpha], [255, 255, 255]);
  lines.push(`\n${persona} / cards (voile ${Math.round(VEIL.alpha * 100)} % sur image blanche)`);
  for (const [label, fgToken] of CARD_PAIRS) {
    const fg = rgba(darkToken(fgToken));
    if (!fg) continue;
    const r = ratio(over(fg, veilOnWhite), veilOnWhite);
    const ok = r >= AA;
    lines.push(`  ${ok ? "✔" : "✘"} ${label.padEnd(26)} ${r.toFixed(2)}:1`);
    if (!ok) failures.push({ persona, mode: "cards", label, ratio: r, fg: darkToken(fgToken), bg: `voile ${VEIL.alpha} sur blanc` });
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

/*
  L'invariant du projet, mis à l'épreuve de l'autre algorithme.

  Les thèmes sont obtenus par rotation de teinte, chaque couleur étant ramenée à
  la **luminance relative WCAG** de l'originale. Les ratios sont donc préservés
  par construction d'un persona à l'autre — mais c'est une garantie *WCAG 2*, et
  rien ne dit a priori qu'elle vaille pour APCA, qui n'a ni la même fonction de
  transfert ni le même modèle.

  On le mesure au lieu de le supposer : pour chaque paire, l'écart de Lc entre
  les trois personas. Proche de zéro, l'invariant tient aussi là. Large, la
  promesse du README ne vaudrait que pour le ratio, et il faudrait le dire.
*/
const parPaire = new Map();
for (const a of apca) {
  const cle = `${a.mode} · ${a.label}`;
  if (!parPaire.has(cle)) parPaire.set(cle, []);
  parPaire.get(cle).push(a.lc);
}
let ecartMax = 0;
let pire = null;
for (const [cle, lcs] of parPaire) {
  const e = Math.max(...lcs) - Math.min(...lcs);
  if (e > ecartMax) {
    ecartMax = e;
    pire = cle;
  }
}

/*
  Seuils APCA usuels — ils dépendent de la typographie, ce que le ratio WCAG
  ignore : Lc 75 pour du texte courant de 16 px, Lc 60 pour du 24 px gras,
  Lc 30 pour du décoratif, Lc 15 pour du non-textuel.

  On retient Lc 60 pour le texte : c'est le seuil du gros caractère, donc le
  plus indulgent applicable ici, et le franchir ne prouve pas qu'un corps de
  16 px passerait. Ce qu'on cherche n'est pas la conformité à un brouillon,
  mais **les divergences entre les deux algorithmes** — là où le ratio dit oui
  et la perception dit moins.
*/
const faibles = apca.filter((a) => (a.texte ? Math.abs(a.lc) < 60 : Math.abs(a.lc) < 15));

console.log(
  `\nAPCA en parallèle (informatif — WCAG 3 n'est pas ratifié) :` +
    `\n  écart de Lc entre personas : ${ecartMax.toFixed(1)} au pire${pire ? ` — ${pire}` : ""}` +
    `\n    (proche de zéro = la rotation de teinte préserve aussi le contraste perceptuel)` +
    `\n  ${faibles.length} paire(s) de texte sous Lc 60, malgré un ratio conforme`,
);
for (const a of faibles) {
  console.log(`    ${a.persona} / ${a.mode} — ${a.label} : Lc ${a.lc.toFixed(0)}`);
}
