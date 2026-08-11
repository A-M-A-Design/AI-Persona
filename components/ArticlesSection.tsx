"use client";

import { ARTICLES } from "../lib/articles";
import { t } from "../lib/i18n";
import { useSettings } from "./useSettings";

export default function ArticlesSection() {
  const { lang } = useSettings();

  return (
    <section className="articles" aria-labelledby="articles-title">
      <h2 id="articles-title" className="articles__title">
        {t(lang, "articlesTitle")}
      </h2>
      <div className="articles__grid">
        {ARTICLES.map((a) => {
          const content = (
            <div className="wel-card__content">
              <p className="wel-card__subtitle">{a.tags.join(" · ")}</p>
              <h3 className="wel-card__title">{a.title}</h3>
              <p className="wel-card__description">{a.excerpt}</p>
              <span className="wel-card__link">
                {a.href ? t(lang, "readOnLinkedIn") : t(lang, "comingSoon")}
              </span>
            </div>
          );
          return a.href ? (
            <a
              key={a.slug}
              className="wel-card wel-card--link articles__card"
              href={a.href}
              target="_blank"
              rel="noreferrer"
            >
              {content}
            </a>
          ) : (
            <article key={a.slug} className="wel-card articles__card">
              {content}
            </article>
          );
        })}
      </div>
    </section>
  );
}
