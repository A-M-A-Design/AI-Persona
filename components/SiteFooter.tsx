"use client";

// Pied de page de la maquette : une invitation à se rencontrer, suivie des
// deux boutons de contact. Il remplace la carte contact qui fermait l'accueil,
// et se trouve désormais sur toutes les pages.
//
// L'invitation est propre au persona actif — « On boit un café ? » pour
// l'ours, « Croisons nos chemins » pour la corneille, « On se voit IRL ? »
// pour la libellule. Elle ne dit surtout pas « Discutons » : ce serait le
// libellé du bouton d'envoi, et le pied de page laisserait croire qu'il ouvre
// lui aussi la conversation.
//
// Les boutons reprennent le composant WDS `button-icon` en variante tertiaire
// — un cercle bordé, pas un aplat : le fond du token tertiaire est transparent
// et c'est le tracé qui porte la couleur.
import { LINKS } from "../lib/articles";
import { t } from "../lib/i18n";
import type { PersonaPublic } from "./chat/Chat";
import { LinkedInIcon, MailIcon } from "./Icons";
import { useSettings } from "./useSettings";

export default function SiteFooter({ personas }: { personas: PersonaPublic[] }) {
  const { lang, persona } = useSettings();
  const actif = personas.find((p) => p.id === persona) ?? personas[0];

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__title">{actif.footerHeading[lang]}</p>
        <div className="site-footer__links">
          <a
            className="ama-button-icon ama-button-icon--tertiary ama-button-icon--sm site-footer__link"
            href={LINKS.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label={t(lang, "footerLinkedIn")}
          >
            <LinkedInIcon />
          </a>
          <a
            className="ama-button-icon ama-button-icon--tertiary ama-button-icon--sm site-footer__link"
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
