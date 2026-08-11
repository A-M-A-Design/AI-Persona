"use client";

import { persistSetting, useSettings } from "../useSettings";

export default function LangToggle() {
  const { lang } = useSettings();
  const next = lang === "fr" ? "en" : "fr";

  function toggle() {
    document.documentElement.setAttribute("lang", next);
    persistSetting({ lang: next });
  }

  return (
    <button
      type="button"
      className="wel-button wel-button--tertiary wel-button--sm"
      onClick={toggle}
      aria-label={lang === "fr" ? "Switch to English" : "Passer en français"}
    >
      {lang === "fr" ? "🇬🇧 EN" : "🇫🇷 FR"}
    </button>
  );
}
