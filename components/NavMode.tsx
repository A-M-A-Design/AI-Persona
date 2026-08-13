"use client";

/**
 * Mode de navigation — clavier ou pointeur — posé en `data-nav-mode` sur
 * `<html>`, et mémorisé.
 *
 * **Ce n'est pas une détection de lecteur d'écran.** Rien n'expose la présence
 * d'une technologie d'assistance ; ce module observe la façon de naviguer, pas
 * l'outil qui navigue. Il se trouve seulement qu'un utilisateur de lecteur
 * d'écran, au bureau, navigue au clavier et ne produit **aucun** événement
 * pointeur : il reste donc en mode clavier toute sa visite.
 *
 * Ce qu'il apporte par rapport au verrou qu'il remplace — la première touche
 * arrêtait la lecture automatique du carrousel, définitivement : le mode est un
 * **état réversible**. Le visiteur voyant qui appuie une fois sur Tab retrouve
 * l'animation dès qu'il reprend la souris ; celui qui ne touche jamais la
 * souris ne la voit jamais. Le même signal, mais sans porte à sens unique.
 *
 * Deux réglages qui comptent :
 *
 * - **Le tactile ne bascule rien.** Un lecteur d'écran mobile balaye l'écran et
 *   produit les mêmes `pointerdown` qu'un doigt ordinaire : les distinguer est
 *   impossible. Seule la souris fait foi, `pointerType` en témoin. Sur tactile
 *   le mode reste donc celui d'avant — inconnu à la première visite, donc
 *   pointeur, comme aujourd'hui. On n'y gagne rien, on n'y perd rien.
 * - **Les touches de saisie ne comptent pas.** Écrire dans un champ, ou y
 *   déplacer le curseur, c'est éditer et non naviguer — et le lanceur de
 *   conversation vit dans le carrousel.
 */
import { useEffect } from "react";
import { persistSetting } from "./useSettings";

/**
 * Touches de navigation. `Tab` est la seule vraiment fiable sous lecteur
 * d'écran : en mode exploration, il passe, là où les flèches sont consommées
 * par le curseur virtuel. Les autres servent au clavier nu.
 */
const NAVIGATION = new Set([
  "Tab",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

export type NavMode = "keyboard" | "pointer";

export default function NavMode() {
  useEffect(() => {
    const racine = document.documentElement;

    const poser = (mode: NavMode) => {
      if (racine.getAttribute("data-nav-mode") === mode) return;
      racine.setAttribute("data-nav-mode", mode);
      persistSetting({ navMode: mode }, "nav-mode");
    };

    function onKeyDown(e: KeyboardEvent) {
      if (!NAVIGATION.has(e.key)) return;
      const cible = e.target as HTMLElement | null;
      if (cible?.closest("input, textarea, select, [contenteditable]")) return;
      poser("keyboard");
    }

    function onPointerDown(e: PointerEvent) {
      // Souris seulement : voir l'en-tête de fichier sur le tactile.
      if (e.pointerType === "mouse") poser("pointer");
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return null;
}
