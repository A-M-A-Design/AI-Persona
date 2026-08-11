"use client";

import { t } from "../../lib/i18n";
import { persistSetting, useSettings } from "../useSettings";

export default function ColorModeToggle() {
  const { colorMode, lang } = useSettings();

  function toggle() {
    const next = colorMode === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-color-mode", next);
    persistSetting({ colorMode: next });
  }

  return (
    <button
      type="button"
      className="wel-button wel-button--secondary wel-button--sm"
      onClick={toggle}
      aria-pressed={colorMode === "dark"}
    >
      {colorMode === "light" ? t(lang, "darkMode") : t(lang, "lightMode")}
    </button>
  );
}
