"use client";

// Header de la maquette : deux chips WDS (avatar, langue) alignés à droite,
// puis un toggle circulaire clair/sombre.
//
// Les chips enveloppent un <select> natif rendu transparent : on garde le
// rendu WDS sans réimplémenter un menu déroulant accessible (clavier, lecteur
// d'écran et sélecteur natif mobile fonctionnent d'origine).
import { t, type StringKey } from "../../lib/i18n";
import { persistSetting, useSettings, type Settings } from "../useSettings";
import HomeLink from "./HomeLink";

const AVATARS: { value: string; labelKey: StringKey }[] = [
  { value: "ours", labelKey: "optionOurs" },
  { value: "corneille", labelKey: "optionCorneille" },
  { value: "libellule", labelKey: "optionLibellule" },
];

const LANGS: { value: "fr" | "en"; label: string }[] = [
  { value: "fr", label: "FR" },
  { value: "en", label: "EN" },
];

function ChipSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <span className="wel-chip wel-chip--dropdown site-nav__chip">
      <span className="wel-chip__label">{current.label}</span>
      <span className="wel-chip__icon" aria-hidden="true">
        ▾
      </span>
      <select
        id={id}
        className="site-nav__select"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

export default function SiteHeader({ withHomeLink = false }: { withHomeLink?: boolean }) {
  const settings = useSettings();
  const { lang } = settings;
  const nextMode = settings.colorMode === "dark" ? "light" : "dark";

  function apply(patch: Partial<Settings>) {
    const d = document.documentElement;
    if (patch.persona) d.setAttribute("data-persona", patch.persona);
    if (patch.colorMode) d.setAttribute("data-color-mode", patch.colorMode);
    if (patch.lang) d.setAttribute("lang", patch.lang);
    persistSetting(patch);
  }

  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        {/* Pages articles uniquement : le bouton d'accueil ouvre la barre à
            gauche, les réglages restant groupés à droite. */}
        {withHomeLink && <HomeLink />}
        <ChipSelect
          id="setting-avatar"
          label={t(lang, "avatarType")}
          value={settings.persona}
          options={AVATARS.map((o) => ({ value: o.value, label: t(lang, o.labelKey) }))}
          onChange={(v) => apply({ persona: v })}
        />
        <ChipSelect
          id="setting-language"
          label={t(lang, "language")}
          value={settings.lang}
          options={LANGS}
          onChange={(v) => apply({ lang: v as "fr" | "en" })}
        />
        <button
          type="button"
          className="site-nav__toggle"
          aria-label={`${t(lang, "colorMode")} — ${t(lang, nextMode === "dark" ? "optionDark" : "optionLight")}`}
          onClick={() => apply({ colorMode: nextMode })}
        >
          <span aria-hidden="true">{settings.colorMode === "dark" ? "☾" : "☀"}</span>
        </button>
      </div>
    </header>
  );
}
