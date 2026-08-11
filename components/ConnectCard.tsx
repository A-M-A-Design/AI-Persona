"use client";

// Carte contact : dans la maquette elle occupe deux colonnes de la seconde
// grille et remplace le footer.
import { LINKS } from "../lib/articles";
import { t, type Lang } from "../lib/i18n";

export default function ConnectCard({ lang }: { lang: Lang }) {
  return (
    <div className="wel-card connect-card">
      {/*
        .wel-icon-slot n'a ni taille ni fond : c'est un inline-flex en
        line-height 0 qui attend un <i> ou un <svg> enfant — un caractère
        texte s'y effondre. La boîte de 76 px et son fond viennent de la
        maquette, l'icône reprend le tracé « around-me ».
      */}
      <span className="wel-icon-slot connect-card__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
          <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" strokeLinecap="round" />
        </svg>
      </span>
      <div className="connect-card__texts">
        <div>
          <p className="connect-card__title">{t(lang, "letsConnect")}</p>
          <p className="connect-card__text">{t(lang, "connectText")}</p>
        </div>
        <div className="connect-card__links">
          <a
            className="wel-link wel-link--icon"
            href={LINKS.linkedin}
            target="_blank"
            rel="noreferrer"
          >
            {t(lang, "footerLinkedIn")}
            <span aria-hidden="true"> →</span>
          </a>
          <a className="wel-link wel-link--icon" href={LINKS.email}>
            {t(lang, "mail")}
            <span aria-hidden="true"> →</span>
          </a>
        </div>
      </div>
    </div>
  );
}
