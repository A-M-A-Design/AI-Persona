"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowRightIcon } from "../Icons";

type Props = {
  disabled: boolean;
  /** Indice de saisie, affiché dans le champ vide. */
  placeholder: string;
  /** Nom accessible du champ — distinct de l'indice, qui disparaît à la frappe. */
  label: string;
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
  label,
  sendLabel,
  onSend,
  className = "chat__composer",
  autoFocus = false,
}: Props) {
  const [value, setValue] = useState("");
  const id = useId();
  const vide = value.trim().length === 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  return (
    <form className={className} onSubmit={submit}>
      <div className="ama-input-text composer__field">
        {/*
          Un vrai <label> plutôt qu'un aria-label recopiant le placeholder :
          l'indice s'efface à la première frappe, le nom accessible doit tenir.
        */}
        <label className="a11y-hidden" htmlFor={id}>
          {label}
        </label>
        <div className="ama-input-text__wrapper">
          <input
            id={id}
            className="ama-input-text__input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            maxLength={2000}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- transfert de focus héro → conversation
            autoFocus={autoFocus}
          />
        </div>
      </div>
      {/*
        Inactif tant qu'il n'y a rien à envoyer, ou pendant une requête.
        L'état inactif est lisible (fond translucide, libellé opaque — cf.
        styles/persona-extras.css) et ne réagit pas au survol, contrairement au
        rendu par défaut du WDS qui effaçait le libellé à 1,25:1.

        `aria-disabled` et non `disabled` : un bouton désactivé sort de l'ordre
        de tabulation, le lecteur d'écran ne le rencontre donc jamais et rien
        n'explique son absence. Là, il est annoncé « indisponible » et le
        formulaire refuse l'envoi par la sortie anticipée de `submit`.
      */}
      <button
        type="submit"
        className="ama-button ama-button--primary ama-button--icon-right"
        aria-disabled={disabled || vide}
        // En mobile la maquette réduit l'action à une icône posée dans le
        // champ : le libellé est masqué visuellement, jamais retiré du nom
        // accessible.
        aria-label={sendLabel}
      >
        <span className="composer__label">{sendLabel}</span>
        <ArrowRightIcon className="composer__arrow" />
      </button>
    </form>
  );
}
