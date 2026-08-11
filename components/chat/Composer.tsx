"use client";

import { useState, type FormEvent } from "react";

type Props = {
  disabled: boolean;
  placeholder: string;
  sendLabel: string;
  onSend: (text: string) => void;
  /** Classe du formulaire : « launcher » dans le héro, « chat__composer » en conversation. */
  className?: string;
  /** Focus au montage — utilisé au passage héro → conversation. */
  autoFocus?: boolean;
};

export default function Composer({
  disabled,
  placeholder,
  sendLabel,
  onSend,
  className = "chat__composer",
  autoFocus = false,
}: Props) {
  const [value, setValue] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  return (
    <form className={className} onSubmit={submit}>
      <div className="wel-input-text composer__field">
        <div className="wel-input-text__wrapper">
          <input
            className="wel-input-text__input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            maxLength={2000}
            aria-label={placeholder}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- transfert de focus héro → conversation
            autoFocus={autoFocus}
          />
        </div>
      </div>
      {/*
        Le bouton n'est jamais désactivé sur champ vide : ce serait l'état par
        défaut de la page, or le style désactivé du WDS repose sur une opacité
        de 0.38 qui ramène le label à 1.25:1 — la CTA principale serait
        illisible au chargement, sans que rien n'explique pourquoi. Un envoi à
        vide est simplement ignoré par submit(). Seule une requête en cours
        désactive réellement le bouton, et cet état-là est transitoire.
      */}
      <button
        type="submit"
        className="wel-button wel-button--primary wel-button--icon-right"
        disabled={disabled}
      >
        {sendLabel}
        <span aria-hidden="true"> →</span>
      </button>
    </form>
  );
}
