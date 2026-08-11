"use client";

// Card-image de la maquette : visuel en fond, dégradé de lisibilité, puis un
// bloc voilé portant le surtitre, le titre et l'appel à l'action.
import Image from "next/image";
import type { Article } from "../lib/articles";
import { t, type Lang } from "../lib/i18n";

type Props = {
  article: Article;
  lang: Lang;
};

// Grande card = moitié de la grille ; card étroite = quart. On sert au plus
// large des deux : l'écart ne justifie pas deux jeux de sources.
const SIZES = "(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 644px";

export default function ArticleCard({ article, lang }: Props) {
  const published = Boolean(article.href);

  const inner = (
    <>
      {/* Visuel décoratif : le sens est porté par le titre de la card. */}
      {article.image && (
        <Image
          className="article-card__image"
          src={article.image}
          alt=""
          fill
          sizes={SIZES}
        />
      )}
      <div className="article-card__body">
        <div className="article-card__fade" />
        <div className="article-card__content">
          <div className="article-card__texts">
            <p className="article-card__kicker">{article.kicker}</p>
            <h3 className="article-card__title">{article.title}</h3>
          </div>
          <span className="wel-button wel-button--secondary wel-button--sm">
            {published ? t(lang, "readArticle") : t(lang, "comingSoon")}
          </span>
        </div>
      </div>
    </>
  );

  // Un article non publié n'est pas un lien : on garde la card, sans cible.
  if (!published) {
    return <article className="article-card">{inner}</article>;
  }

  return (
    <a
      className="article-card"
      href={article.href}
      target="_blank"
      rel="noreferrer"
    >
      {inner}
    </a>
  );
}
