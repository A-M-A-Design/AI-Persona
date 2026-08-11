"use client";

// Les deux grilles de la maquette : les articles mis en avant occupent des
// grandes cards carrées, les suivants des cards étroites partageant la rangée
// avec la carte contact.
import { ARTICLES, FEATURED_COUNT } from "../lib/articles";
import ArticleCard from "./ArticleCard";
import ConnectCard from "./ConnectCard";
import { useSettings } from "./useSettings";

export default function ArticlesSection() {
  const { lang, persona } = useSettings();
  const featured = ARTICLES.slice(0, FEATURED_COUNT);
  const rest = ARTICLES.slice(FEATURED_COUNT);

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
