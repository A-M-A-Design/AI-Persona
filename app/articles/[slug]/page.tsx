import { notFound } from "next/navigation";
import ArticleCarousel from "../../../components/article/ArticleCarousel";
import ArticleView from "../../../components/article/ArticleView";
import QuickAccess from "../../../components/QuickAccess";
import SiteHeader from "../../../components/header/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import { hasTranslation, readArticleBodies } from "../../../lib/article-body";
import { ARTICLES } from "../../../lib/articles";
import { getPublicPersonas } from "../../../lib/personas";

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
  // Le carousel de fin propose les autres articles — jamais celui qu'on lit.
  const others = ARTICLES.filter((a) => a.slug !== slug);

  // La barre de navigation des articles porte le bouton d'accueil, à gauche.
  return (
    <>
      {/* Sans `accueil` : ni lanceur de conversation ni grille d'articles sur
          cette page, un raccourci vers une cible absente ne vaut rien. */}
      <QuickAccess />
      <SiteHeader withHomeLink />
      <main className="page page--article" id="contenu" tabIndex={-1}>
        <ArticleView article={article} blocks={blocks} translated={translated} others={others} />
      </main>
      <SiteFooter personas={getPublicPersonas()} />
    </>
  );
}
