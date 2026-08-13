"use client";

// Les deux grilles de la maquette : les articles mis en avant occupent des
// grandes cards carrées, les suivants une rangée de cards étroites. Le contact
// n'est plus une card — il est passé dans le pied de page, présent partout.
import { ARTICLES, FEATURED_COUNT } from "../lib/articles";
import { t } from "../lib/i18n";
import ArticleCard from "./ArticleCard";
import { useSettings } from "./useSettings";

export default function ArticlesSection() {
  const { lang, persona } = useSettings();
  const featured = ARTICLES.slice(0, FEATURED_COUNT);
  const rest = ARTICLES.slice(FEATURED_COUNT);

  // Les titres des cards sont des h3 : sans h2 au-dessus, la hiérarchie saute
  // un niveau après le h1 du héro. La maquette ne dessine pas ces titres, ils
  // sont donc réservés aux technologies d'assistance — ils nomment aussi les
  // deux grilles, qui n'étaient jusque-là que des blocs anonymes.
  return (
    <>
      {/* `tabIndex={-1}` pour la même raison que `main` : sans lui, certains
          navigateurs déplacent la vue sans déplacer le focus, et la tabulation
          suivante repart du début de la page. */}
      <section
        className="articles"
        id="articles"
        tabIndex={-1}
        aria-labelledby="articles-une"
      >
        <h2 className="a11y-hidden" id="articles-une">
          {t(lang, "featuredArticles")}
        </h2>
        {featured.map((a) => (
          <ArticleCard key={a.slug} article={a} lang={lang} persona={persona} />
        ))}
      </section>

      <section className="articles articles--secondary" aria-labelledby="articles-suite">
        <h2 className="a11y-hidden" id="articles-suite">
          {t(lang, "moreArticles")}
        </h2>
        {rest.map((a) => (
          <ArticleCard key={a.slug} article={a} lang={lang} persona={persona} />
        ))}
      </section>
    </>
  );
}
