"use client";

// Retour à l'accueil des pages articles. La maquette a remplacé la pilule
// « Retour » par un bouton d'icône : il ouvre la barre de navigation à gauche,
// les réglages restant groupés à droite.
import Link from "next/link";
import { t } from "../../lib/i18n";
import { HomeIcon } from "../Icons";
import { useSettings } from "../useSettings";

export default function HomeLink() {
  const { lang } = useSettings();
  return (
    <Link
      href="/"
      className="ama-button-icon ama-button-icon--primary ama-button-icon--sm site-nav__home"
      aria-label={t(lang, "backToHome")}
    >
      <HomeIcon />
    </Link>
  );
}
