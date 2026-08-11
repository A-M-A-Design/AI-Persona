"use client";

import { useEffect, useState } from "react";

type ColorMode = "light" | "dark";

const STORAGE_KEY = "ai-persona:settings";

function readSettings(): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export default function ColorModeToggle() {
  const [mode, setMode] = useState<ColorMode>("light");

  // Synchronise l'état React avec l'attribut posé par le script anti-flash.
  useEffect(() => {
    if (document.documentElement.getAttribute("data-color-mode") === "dark") {
      setMode("dark");
    }
  }, []);

  function toggle() {
    const next: ColorMode = mode === "light" ? "dark" : "light";
    setMode(next);
    document.documentElement.setAttribute("data-color-mode", next);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readSettings(), colorMode: next }),
    );
  }

  return (
    <button
      type="button"
      className="wel-button wel-button--secondary wel-button--sm"
      onClick={toggle}
      aria-pressed={mode === "dark"}
    >
      {mode === "light" ? "🌙 Mode sombre" : "☀️ Mode clair"}
    </button>
  );
}
