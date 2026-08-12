"use client";

// Pied de page de la maquette : « Discutons ! » suivi des deux boutons de
// contact. Il remplace la carte contact qui fermait l'accueil, et se trouve
// désormais sur toutes les pages.
//
// Les boutons reprennent le composant WDS `button-icon` en variante tertiaire
// — un cercle bordé, pas un aplat : le fond du token tertiaire est transparent
// et c'est le tracé qui porte la couleur.
import { LINKS } from "../lib/articles";
import { t } from "../lib/i18n";
import { LinkedInIcon, MailIcon } from "./Icons";
import { useSettings } from "./useSettings";

export default function SiteFooter() {
  const { lang } = useSettings();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__title">{t(lang, "footerLetsChat")}</p>
        <div className="site-footer__links">
          <a
            className="wel-button-icon wel-button-icon--tertiary wel-button-icon--sm site-footer__link"
            href={LINKS.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label={t(lang, "footerLinkedIn")}
          >
            <LinkedInIcon />
          </a>
          <a
            className="wel-button-icon wel-button-icon--tertiary wel-button-icon--sm site-footer__link"
            href={LINKS.email}
            aria-label={t(lang, "mail")}
          >
            <MailIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
