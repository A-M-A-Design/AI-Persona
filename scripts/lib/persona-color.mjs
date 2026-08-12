/**
 * Transformation de teinte des personas, à luminance relative constante.
 *
 * Ce module est la source unique de la couleur persona : `build-themes.mjs`
 * l'applique aux littéraux du theme.css WDS, `build-tokens-ama.mjs` l'applique
 * aux primitives de l'export de tokens. Les deux chaînes doivent rendre la même
 * couleur au bit près — c'est ce qu'exige `check-tokens.mjs`, et ce ne peut être
 * vrai que si la fonction est littéralement la même.
 *
 * Ne rien recalculer à la main ici : toute retouche de teinte se répercute sur
 * les deux pipelines et sur les ratios de contraste vérifiés par `npm run a11y`.
 */

// ---------- conversions ----------

export function rgbToHsl(r, g, b) {
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

export function hslToRgb(h, s, l) {
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

/** Luminance relative WCAG — la grandeur qui détermine les ratios de contraste. */
export function relLuminance([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/**
 * Retrouve la clarté HSL qui restitue une luminance relative cible, à teinte et
 * saturation données. La luminance croît de façon monotone avec la clarté, donc
 * une recherche binaire converge.
 *
 * C'est ce qui rend les contrastes réellement invariants : conserver la clarté
 * HSL ne suffit pas, puisque le vert pèse 0,7152 dans la luminance contre 0,0722
 * pour le bleu — tourner un bleu vers le cyan éclaircit la couleur à clarté
 * constante, et fait chuter le contraste d'un texte clair posé dessus.
 */
export function atLuminance(h, s, target) {
  let lo = 0;
  let hi = 1;
  let rgb = hslToRgb(h, s, 0.5);
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    rgb = hslToRgb(h, s, mid);
    if (relLuminance(rgb) < target) lo = mid;
    else hi = mid;
  }
  return rgb;
}

// ---------- teinte persona ----------

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
export function transformRgb([r, g, b], rules) {
  const targetLum = relLuminance([r, g, b]);
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
  // Les gris restent des gris : rien à corriger, et la recherche binaire
  // introduirait un arrondi inutile.
  if (s === 0) return hslToRgb(h, s, l);
  return atLuminance(h, s, targetLum);
}

// ---------- hex ----------

export const hex2 = (v) => v.toString(16).padStart(2, "0");

export const rgbToHex = ([r, g, b]) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

export const contrast = (a, b) => {
  const [l1, l2] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// ---------- surface-alternative ----------

/**
 * `surface-alternative` est présent dans la bibliothèque Figma et dans l'export
 * de tokens 2.2.2, mais pas dans le theme.css livré par le paquet WDS installé.
 *
 * En clair, on reprend la valeur brandbook telle quelle : #F5F6FF sur un
 * `surface` blanc, soit un écart de contraste de 1,076 — c'est exactement
 * `wel.prim.color.tropos.97` dans l'export.
 *
 * En sombre, l'export donne au token la valeur exacte de `surface` — l'écart
 * n'y existe donc pas, et la barre ne se détacherait que par son ombre. On le
 * dérive plutôt du `surface` sombre : même teinte, même saturation, luminance
 * relevée du même écart qu'en clair.
 */
export const SURFACE_ALTERNATIVE_LIGHT = "#f5f6ff";

/** Écart visé, mesuré sur la paire brandbook en mode clair. */
export const ALT_CONTRAST = contrast(hexToRgb("#ffffff"), hexToRgb(SURFACE_ALTERNATIVE_LIGHT));

/** Décale `surface` d'un pas d'ALT_CONTRAST, en s'éloignant de l'extrême. */
export function alternativeOf(hex) {
  const rgb = hexToRgb(hex);
  const lum = relLuminance(rgb);
  const [h, s] = rgbToHsl(...rgb);
  const target =
    lum > 0.5 ? (lum + 0.05) / ALT_CONTRAST - 0.05 : (lum + 0.05) * ALT_CONTRAST - 0.05;
  return rgbToHex(atLuminance(h, s, target));
}
