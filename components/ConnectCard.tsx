"use client";

// Carte contact : dans la maquette elle occupe deux colonnes de la seconde
// grille et remplace le footer.
import { LINKS } from "../lib/articles";
import { t, type Lang } from "../lib/i18n";

export default function ConnectCard({ lang }: { lang: Lang }) {
  return (
    <div className="wel-card connect-card">
      <span className="wel-icon-slot" aria-hidden="true">
        ◎
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
