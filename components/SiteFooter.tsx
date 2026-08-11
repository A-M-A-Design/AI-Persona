"use client";

import { LINKS } from "../lib/articles";
import { t } from "../lib/i18n";
import { useSettings } from "./useSettings";

export default function SiteFooter() {
  const { lang } = useSettings();

  return (
    <footer className="site-footer">
      <div className="wel-separator site-footer__separator" role="presentation" />
      <div className="site-footer__links">
        <a className="wel-link" href={LINKS.linkedin} target="_blank" rel="noreferrer">
          {t(lang, "footerLinkedIn")}
        </a>
        <a className="wel-link" href={LINKS.email}>
          {t(lang, "footerEmail")}
        </a>
      </div>
      <p className="site-footer__note">© Arthur Mathon — AI Persona</p>
    </footer>
  );
}
