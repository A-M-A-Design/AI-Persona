"use client";

import { t } from "../../lib/i18n";
import { persistSetting, useSettings } from "../useSettings";

const PERSONAS = [
  { id: "ours", emoji: "🐻", label: "Ours" },
  { id: "corneille", emoji: "🐦‍⬛", label: "Corneille" },
  { id: "libellule", emoji: "✨", label: "Libellule" },
] as const;

export default function PersonaSwitcher() {
  const { persona, lang } = useSettings();

  function pick(id: string) {
    document.documentElement.setAttribute("data-persona", id);
    persistSetting({ persona: id });
  }

  return (
    <div role="radiogroup" aria-label={t(lang, "personaLabel")} className="persona-switcher">
      {PERSONAS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={persona === p.id}
          className={`wel-chip${persona === p.id ? " wel-chip--selected" : ""}`}
          onClick={() => pick(p.id)}
        >
          {p.emoji} {p.label}
        </button>
      ))}
    </div>
  );
}
