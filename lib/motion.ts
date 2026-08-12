/**
 * Respect de `prefers-reduced-motion` pour les défilements pilotés en
 * JavaScript. Les animations CSS l'écoutent déjà par media query, mais
 * `scrollBy({ behavior: "smooth" })` l'ignore : c'est une valeur passée à
 * l'API, pas une propriété que la feuille de style peut neutraliser.
 *
 * Lu à chaque appel plutôt que mémorisé : le réglage système peut changer en
 * cours de session, et un défilement n'est pas un chemin chaud.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Valeur de `behavior` à passer aux API de défilement. */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}
