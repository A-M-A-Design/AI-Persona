"use client";

// Pilule « Retour » des pages articles, logée dans la barre de navigation.
// Elle y reste à toutes les largeurs : la barre étant déjà collante, la
// pilule suit la lecture sans jamais passer par-dessus le texte, ce qui
// arrivait quand elle était posée au-dessus de l'article.
import Link from "next/link";
import { t } from "../../lib/i18n";
import { useSettings } from "../useSettings";

export default function BackLink() {
  const { lang } = useSettings();
  return (
    <Link href="/" className="wel-button wel-button--primary wel-button--sm article-back">
      <span aria-hidden="true">←</span>
      {t(lang, "goBack")}
    </Link>
  );
}
