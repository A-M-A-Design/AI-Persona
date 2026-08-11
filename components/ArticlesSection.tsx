"use client";

// Les deux grilles de la maquette : les articles mis en avant occupent des
// grandes cards carrées, les suivants des cards étroites partageant la rangée
// avec la carte contact.
import { ARTICLES, FEATURED_COUNT, HOME_COUNT } from "../lib/articles";
import ArticleCard from "./ArticleCard";
import ConnectCard from "./ConnectCard";
import { useSettings } from "./useSettings";

export default function ArticlesSection() {
  const { lang, persona } = useSettings();
  // La grille garde la composition de la maquette : au-delà de quatre cards,
  // la rangée étroite déborderait sous la carte contact.
  const shown = ARTICLES.slice(0, HOME_COUNT);
  const featured = shown.slice(0, FEATURED_COUNT);
  const rest = shown.slice(FEATURED_COUNT);

  return (
    <>
      <section className="articles">
        {featured.map((a) => (
          <ArticleCard key={a.slug} article={a} lang={lang} persona={persona} />
        ))}
      </section>

      <section className="articles articles--secondary">
        {rest.map((a) => (
          <ArticleCard key={a.slug} article={a} lang={lang} persona={persona} />
        ))}
        <ConnectCard lang={lang} />
      </section>
    </>
  );
}
