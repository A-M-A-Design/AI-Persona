"use client";

// Card-image de la maquette : visuel en fond, dégradé de lisibilité, puis un
// bloc voilé portant le surtitre, le titre et l'appel à l'action.
import Image from "next/image";
import Link from "next/link";
import { articlePath, type Article } from "../lib/articles";
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
  // Le nom accessible du lien est calculé à partir de ces deux éléments, dans
  // cet ordre : « Lire l'article, Comment remettre en mouvement une entreprise
  // traumatisée ? ». Sans eux, il vaut la concaténation de tout le contenu de
  // la card — surtitre compris — et commence donc par « SOCIÉTÉ ».
  const titreId = `card-titre-${article.slug}`;
  const ctaId = `card-cta-${article.slug}`;

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
            <h3 className="article-card__title" id={titreId}>
              {article.title[lang]}
            </h3>
          </div>
          <span className="wel-button wel-button--secondary wel-button--sm" id={ctaId}>
            {t(lang, "readArticle")}
          </span>
        </div>
      </div>
    </>
  );

  // Chaque article a désormais sa page : la card mène au site, plus à LinkedIn.
  // Sans visuel, la card porte un aplat de thème : son texte est clair, il lui
  // faut un fond sombre sous lui.
  return (
    <Link
      className={`article-card${article.image ? "" : " article-card--flat"}`}
      href={articlePath(article.slug)}
      aria-labelledby={`${ctaId} ${titreId}`}
    >
      {inner}
    </Link>
  );
}
