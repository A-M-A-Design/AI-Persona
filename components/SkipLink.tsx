"use client";

// Premier élément focalisable du document : il permet d'atteindre le contenu
// sans retraverser les réglages de la barre à chaque page. Hors écran au repos,
// il descend dans la page dès qu'il reçoit le focus.
//
// Client, parce que son libellé suit la langue choisie, qui vit dans les
// réglages persistés.
import { t } from "../lib/i18n";
import { useSettings } from "./useSettings";

export default function SkipLink() {
  const { lang } = useSettings();
  return (
    <a className="skip-link" href="#contenu">
      {t(lang, "skipToContent")}
    </a>
  );
}
