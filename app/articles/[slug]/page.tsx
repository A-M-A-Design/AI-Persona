import { notFound } from "next/navigation";
import ArticleCarousel from "../../../components/article/ArticleCarousel";
import ArticleView from "../../../components/article/ArticleView";
import { DonneesArticle } from "../../../components/DonneesStructurees";
import QuickAccess from "../../../components/QuickAccess";
import SiteHeader from "../../../components/header/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import { hasTranslation, readArticleBodies } from "../../../lib/article-body";
import type { Metadata } from "next";
import { ARTICLES, articlePath } from "../../../lib/articles";
import { AUTEUR } from "../../../lib/site";
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
  const chemin = articlePath(slug);
  return {
    title: article.title.fr,
    description: article.lede.fr,
    alternates: { canonical: chemin },
    openGraph: {
      type: "article",
      url: chemin,
      title: article.title.fr,
      description: article.lede.fr,
      /*
        Le visuel de l'article lui-même : celui qui illustre déjà sa card sur
        l'accueil. Un aperçu partagé montre donc ce que le lecteur retrouvera
        en arrivant, et non une carte générée qui n'existe nulle part ailleurs.
      */
      images: article.image
        ? [{ url: article.image, alt: article.title.fr }]
        : undefined,
      authors: [AUTEUR.nom],
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title.fr,
      description: article.lede.fr,
      images: article.image ? [article.image] : undefined,
    },
  } satisfies Metadata;
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
      <DonneesArticle article={article} />
      <QuickAccess />
      <SiteHeader withHomeLink />
      <main className="page page--article" id="contenu" tabIndex={-1}>
        <ArticleView article={article} blocks={blocks} translated={translated} others={others} />
      </main>
      <SiteFooter personas={getPublicPersonas()} />
    </>
  );
}
