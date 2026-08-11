"use client";

// Les deux grilles de la maquette : les articles mis en avant occupent des
// grandes cards carrées, les suivants une rangée de cards étroites. La carte
// contact les suit sur toute la largeur — elle partageait auparavant la rangée
// étroite, que les articles occupent désormais en entier.
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
      </section>

      <ConnectCard lang={lang} />
    </>
  );
}
