"use client";

// Hook partagé : lit persona/langue/mode depuis <html> (posés par le script
// anti-flash) et se resynchronise à chaque événement de settings.
import { useEffect, useState } from "react";
import type { Lang } from "../lib/i18n";

export const SETTINGS_EVENT = "ai-persona:settings";
export const STORAGE_KEY = "ai-persona:settings";

export type Settings = {
  persona: string;
  lang: Lang;
  colorMode: "light" | "dark";
  /**
   * Raccourcis clavier globaux. Actifs par défaut, désactivables — c'est la
   * première échappatoire de WCAG 2.1.4, obligatoire dès qu'un raccourci
   * n'utilise qu'une touche imprimable sans modificateur.
   */
  shortcuts: boolean;
  /**
   * Lecture automatique du carrousel. Passe à `false` — et le reste — dès que
   * le visiteur navigue au clavier.
   *
   * C'est le plus près qu'on puisse aller de « en pause quand un lecteur
   * d'écran est actif » : **aucune API ne permet de détecter un lecteur
   * d'écran**, et les heuristiques qui circulent relèvent du pistage autant
   * que de l'approximation. Ce qu'on peut observer, c'est la navigation au
   * clavier — que tout utilisateur de lecteur d'écran pratique. L'inverse
   * n'est pas vrai : un visiteur voyant au clavier perd aussi l'animation.
   * Arbitrage assumé, du 2026-08-13.
   */
  slideshowAuto: boolean;
};

export function readCurrentSettings(): Settings {
  const d = document.documentElement;
  return {
    persona: d.getAttribute("data-persona") ?? "ours",
    lang: d.getAttribute("lang") === "en" ? "en" : "fr",
    colorMode: d.getAttribute("data-color-mode") === "dark" ? "dark" : "light",
    shortcuts: d.getAttribute("data-shortcuts") !== "off",
    slideshowAuto: d.getAttribute("data-slideshow-auto") !== "off",
  };
}

/**
 * Qui a demandé le changement. Le slideshow s'en sert pour distinguer « c'est
 * moi qui viens de changer de slide » de « on m'a changé de l'extérieur », et
 * ne mettre sa lecture automatique en pause que dans le second cas.
 *
 * Porté par l'événement plutôt que déduit d'un drapeau posé dans un effet :
 * en développement React rejoue les effets au montage, et toute inférence de
 * ce genre se déclenche à faux.
 */
export type SettingsSource = "slideshow" | "nav";

export function persistSetting(patch: Partial<Settings>, source: SettingsSource = "nav") {
  let stored: Record<string, unknown> = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    /* localStorage corrompu : on repart de zéro */
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, ...patch }));
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: { source } }));
}

export function useSettings(): Settings {
  // Défauts SSR (fr/ours/light) puis synchronisation au mount — évite tout
  // mismatch d'hydratation.
  const [settings, setSettings] = useState<Settings>({
    persona: "ours",
    lang: "fr",
    colorMode: "light",
    shortcuts: true,
    slideshowAuto: true,
  });

  useEffect(() => {
    const update = () => setSettings(readCurrentSettings());
    update();
    window.addEventListener(SETTINGS_EVENT, update);
    return () => window.removeEventListener(SETTINGS_EVENT, update);
  }, []);

  return settings;
}
