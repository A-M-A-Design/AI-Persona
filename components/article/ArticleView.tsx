"use client";

// Page d'un article : surtitre, titre, chapô, visuel, puis le corps dans une
// colonne de lecture étroite (850 px en desktop, 550 en tablette). En mobile
// la colonne occupe toute la largeur disponible.
//
// Le composant est client parce que le titre, le surtitre et le chapô suivent
// la langue choisie, qui vit dans les réglages persistés. Le corps, lui, est
// analysé côté serveur et transmis en blocs sérialisables.
import Image from "next/image";
import type { Block } from "../../lib/article-body";
import type { Article } from "../../lib/articles";
import { t, type Lang } from "../../lib/i18n";
import { useSettings } from "../useSettings";
import ArticleCarousel from "./ArticleCarousel";

/** Rend le gras markdown, seul balisage en ligne présent dans les articles. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

export default function ArticleView({
  article,
  blocks,
  translated,
  others,
}: {
  article: Article;
  blocks: Record<Lang, Block[]>;
  /** Faux quand l'anglais retombe sur le texte français. */
  translated: boolean;
  /** Les autres articles, proposés en fin de lecture. */
  others: Article[];
}) {
  const { lang, persona } = useSettings();
  const body = blocks[lang];
  const inFrench = lang === "fr" || !translated;

  // La pilule « Retour » vit dans la barre de navigation, à toutes les
  // largeurs : posée au-dessus de l'article, elle recouvrait le texte dès que
  // la colonne de lecture atteignait le bord du retrait de page (entre 768 et
  // ~1100 px, la colonne commence exactement là où se trouvait la pilule).
  return (
    <>
      <article className="article">
        <header className="article__head">
          <p className="article__kicker">{article.kicker[lang]}</p>
          <h1 className="article__title">{article.title[lang]}</h1>
          <p className="article__lede">{article.lede[lang]}</p>
        </header>

        {article.image && (
          <div className="article__media">
            {/* Visuel décoratif : le sens est porté par le titre. */}
            <Image
              className="article__image"
              src={article.image}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 550px, 850px"
              priority
            />
          </div>
        )}

        {/* L'avertissement ne sert que si l'article n'a pas de traduction et
            retombe sur le français : inutile de le montrer sinon. */}
        {lang === "en" && !translated && (
          <p className="article__notice">{t(lang, "articleFrenchOnly")}</p>
        )}

        {/*
          `lang` **uniquement quand le corps parle une autre langue que le
          document**, c'est-à-dire quand l'interface est en anglais et que
          l'article n'a pas de traduction. Sinon l'attribut ne fait que répéter
          le `lang` de `<html>` : une frontière de langue posée sur 4 000
          caractères, que rien ne justifie et que les lecteurs d'écran traitent
          comme un changement de voix.

          Ce qui motivait l'attribut reste vrai : la synthèse vocale ne doit pas
          lire du français avec une voix anglaise. C'est ce cas-là, et lui seul,
          qui est marqué.
        */}
        <div className="article__body" lang={inFrench && lang === "en" ? "fr" : undefined}>
          {body.map((block, i) => {
            if (block.type === "heading") {
              return (
                <h2 key={i} className="article__h2">
                  {block.text}
                </h2>
              );
            }
            if (block.type === "quote") {
              return (
                <blockquote key={i} className="article__quote">
                  {inline(block.text)}
                </blockquote>
              );
            }
            if (block.type === "list") {
              return (
                <ul key={i} className="article__list">
                  {block.items.map((item, j) => (
                    <li key={j}>{inline(item)}</li>
                  ))}
                </ul>
              );
            }
            return <p key={i}>{inline(block.text)}</p>;
          })}
        </div>
      </article>

      {/* Hors de la colonne de lecture : le carousel occupe toute la largeur. */}
      <ArticleCarousel articles={others} lang={lang} persona={persona} />
    </>
  );
}
