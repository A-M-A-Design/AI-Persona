"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ai-persona:settings";
export const SETTINGS_EVENT = "ai-persona:settings";

const PERSONAS = [
  { id: "ours", emoji: "🐻", label: "Ours" },
  { id: "corneille", emoji: "🐦‍⬛", label: "Corneille" },
  { id: "libellule", emoji: "✨", label: "Libellule" },
] as const;

function readSettings(): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export default function PersonaSwitcher() {
  const [active, setActive] = useState<string>("ours");

  useEffect(() => {
    setActive(document.documentElement.getAttribute("data-persona") ?? "ours");
  }, []);

  function pick(id: string) {
    setActive(id);
    document.documentElement.setAttribute("data-persona", id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSettings(), persona: id }));
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }

  return (
    <div role="radiogroup" aria-label="Choisir un persona" className="persona-switcher">
      {PERSONAS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={active === p.id}
          className={`wel-chip${active === p.id ? " wel-chip--selected" : ""}`}
          onClick={() => pick(p.id)}
        >
          {p.emoji} {p.label}
        </button>
      ))}
    </div>
  );
}
