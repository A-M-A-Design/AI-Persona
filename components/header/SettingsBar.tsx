"use client";

// Trois selects WDS : Avatar Type / Language / Color Mode (sans emoji).
import { t, type StringKey } from "../../lib/i18n";
import { persistSetting, useSettings, type Settings } from "../useSettings";

type Option = { value: string; labelKey: StringKey };

const AVATARS: Option[] = [
  { value: "ours", labelKey: "optionOurs" },
  { value: "corneille", labelKey: "optionCorneille" },
  { value: "libellule", labelKey: "optionLibellule" },
];
const LANGS: { value: "fr" | "en"; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];
const MODES: Option[] = [
  { value: "light", labelKey: "optionLight" },
  { value: "dark", labelKey: "optionDark" },
];

function Select({
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
  return (
    <div className="ama-select settings-bar__select">
      <label className="ama-select__label" htmlFor={id}>
        <span className="ama-select__label-text">{label}</span>
      </label>
      <span className="ama-select__control-wrapper">
        <select
          id={id}
          className="ama-select__control"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="ama-select__icon" aria-hidden="true">
          ▾
        </span>
      </span>
    </div>
  );
}

export default function SettingsBar() {
  const settings = useSettings();
  const { lang } = settings;

  function apply(patch: Partial<Settings>) {
    const d = document.documentElement;
    if (patch.persona) d.setAttribute("data-persona", patch.persona);
    if (patch.colorMode) d.setAttribute("data-color-mode", patch.colorMode);
    if (patch.lang) d.setAttribute("lang", patch.lang);
    persistSetting(patch);
  }

  return (
    <div className="settings-bar">
      <Select
        id="setting-avatar"
        label={t(lang, "avatarType")}
        value={settings.persona}
        options={AVATARS.map((o) => ({ value: o.value, label: t(lang, o.labelKey) }))}
        onChange={(v) => apply({ persona: v })}
      />
      <Select
        id="setting-language"
        label={t(lang, "language")}
        value={settings.lang}
        options={LANGS}
        onChange={(v) => apply({ lang: v as "fr" | "en" })}
      />
      <Select
        id="setting-color-mode"
        label={t(lang, "colorMode")}
        value={settings.colorMode}
        options={MODES.map((o) => ({ value: o.value, label: t(lang, o.labelKey) }))}
        onChange={(v) => apply({ colorMode: v as "light" | "dark" })}
      />
    </div>
  );
}
