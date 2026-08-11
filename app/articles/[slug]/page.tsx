import { notFound } from "next/navigation";
import ArticleView from "../../../components/article/ArticleView";
import SiteHeader from "../../../components/header/SiteHeader";
import { hasTranslation, readArticleBodies } from "../../../lib/article-body";
import { ARTICLES } from "../../../lib/articles";

// Les quatre articles de la grille sont connus au build : leurs pages sont
// générées statiquement, et toute autre valeur de slug donne un 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return {};
  // Les métadonnées sont rendues au build, hors de portée du réglage de langue
  // (persisté côté client) : on prend le français, langue de rédaction.
  return { title: article.title.fr, description: article.lede.fr };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  const blocks = readArticleBodies(slug);
  const translated = hasTranslation(slug, "en");

  // La pilule « Retour » est portée par la barre de navigation.
  return (
    <>
      <SiteHeader withBackLink />
      <main className="page page--article">
        <ArticleView article={article} blocks={blocks} translated={translated} />
      </main>
    </>
  );
}
