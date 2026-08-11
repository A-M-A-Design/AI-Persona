"use client";

// Hook partagé : lit persona/langue/mode depuis <html> (posés par le script
// anti-flash) et se resynchronise à chaque événement de settings.
import { useEffect, useState } from "react";
import type { Lang } from "../lib/i18n";

export const SETTINGS_EVENT = "ai-persona:settings";
export const STORAGE_KEY = "ai-persona:settings";

export type Settings = { persona: string; lang: Lang; colorMode: "light" | "dark" };

export function readCurrentSettings(): Settings {
  const d = document.documentElement;
  return {
    persona: d.getAttribute("data-persona") ?? "ours",
    lang: d.getAttribute("lang") === "en" ? "en" : "fr",
    colorMode: d.getAttribute("data-color-mode") === "dark" ? "dark" : "light",
  };
}

export function persistSetting(patch: Partial<Settings>) {
  let stored: Record<string, unknown> = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    /* localStorage corrompu : on repart de zéro */
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, ...patch }));
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

export function useSettings(): Settings {
  // Défauts SSR (fr/ours/light) puis synchronisation au mount — évite tout
  // mismatch d'hydratation.
  const [settings, setSettings] = useState<Settings>({
    persona: "ours",
    lang: "fr",
    colorMode: "light",
  });

  useEffect(() => {
    const update = () => setSettings(readCurrentSettings());
    update();
    window.addEventListener(SETTINGS_EVENT, update);
    return () => window.removeEventListener(SETTINGS_EVENT, update);
  }, []);

  return settings;
}
