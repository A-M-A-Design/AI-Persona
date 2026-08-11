"use client";

// Card-image de la maquette : visuel en fond, dégradé de lisibilité, puis un
// bloc voilé portant le surtitre, le titre et l'appel à l'action.
import Image from "next/image";
import type { Article } from "../lib/articles";
import { t, type Lang } from "../lib/i18n";

type Props = {
  article: Article;
  lang: Lang;
  /** Nécessaire au scope local : les thèmes sont en sélecteur composé
      [data-persona][data-color-mode], les deux attributs doivent donc être
      portés par le même élément. */
  persona: string;
};

// Grande card = moitié de la grille ; card étroite = quart. On sert au plus
// large des deux : l'écart ne justifie pas deux jeux de sources.
const SIZES = "(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 644px";

export default function ArticleCard({ article, lang, persona }: Props) {
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
      {/*
        Le contenu repose toujours sur un voile foncé, quel que soit le mode de
        la page : on force donc le mode sombre localement, comme la maquette où
        le titre vaut #f7f9fb en clair comme en sombre. Sans ça, on-surface-hi
        s'inverserait et rendrait du texte foncé sur fond foncé.
      */}
      <div
        className="article-card__body"
        data-persona={persona}
        data-color-mode="dark"
      >
        <div className="article-card__fade" />
        <div className="article-card__content">
          <div className="article-card__texts">
            <p className="article-card__kicker">{article.kicker[lang]}</p>
            <h3 className="article-card__title">{article.title[lang]}</h3>
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
