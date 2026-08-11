// Métadonnées des articles affichés dans la grille Articles (client-safe).
//
// L'ordre du tableau est l'ordre d'affichage : les deux premiers occupent les
// grandes cards carrées de la première grille, les suivants les cards étroites
// de la seconde — c'est la composition de la maquette Figma.
import type { Lang } from "./i18n";

export type Article = {
  slug: string;
  title: Record<Lang, string>;
  /** Surtitre de la card, rendu en capitales — « kicker » dans la maquette. */
  kicker: Record<Lang, string>;
  tags: string[];
  /** Chapô de la page article, rendu en italique sous le titre. */
  lede: Record<Lang, string>;
  /** Visuel de fond de la card. Absent = aplat de thème (pas de visuel dans la maquette). */
  image?: string;
};

/** Chemin de la page d'un article. Les cards de la home pointent ici, plus vers LinkedIn. */
export function articlePath(slug: string): string {
  return `/articles/${slug}`;
}

export const ARTICLES: Article[] = [
  {
    slug: "entreprise-traumatisee",
    title: {
      fr: "Comment remettre en mouvement une entreprise traumatisée ?",
      en: "How can you get a traumatized company back on track?",
    },
    kicker: { fr: "Société", en: "Society" },
    tags: ["DesignOps", "OrgDesign", "Recherche"],
    lede: {
      fr: "Trauma organisationnel, résilience et tenségrité : ce que les neurosciences et le vivant nous apprennent pour libérer une organisation figée.",
      en: "Organizational trauma, resilience and tensegrity: what neuroscience and living systems teach us about freeing a frozen organization.",
    },
    image: "/articles/entreprise-traumatisee.jpg",
  },
  {
    slug: "roi-design-system",
    title: {
      fr: "Comment mesurer le ROI d'un Design Système ?",
      en: "How to measure Design System ROI",
    },
    kicker: { fr: "Ops et Design System", en: "Ops and Design System" },
    tags: ["Business", "DesignSystem"],
    lede: {
      fr: "Indicateurs qualitatifs et quantitatifs, KPI à suivre : rendre tangible la valeur d'un design system auprès du comité exécutif.",
      en: "Qualitative and quantitative indicators, KPIs to track: making a design system's value tangible to the executive committee.",
    },
    image: "/articles/roi-design-system.jpg",
  },
  {
    slug: "systeme-de-tokens",
    title: {
      fr: "Pourquoi et comment créer un système de tokens applicable à vos produits digitaux",
      en: "Why and how to build a token system for your digital products",
    },
    kicker: { fr: "Design System et Product", en: "Design System and Product" },
    tags: ["DesignSystem", "Product"],
    lede: {
      fr: "Des années 1990 à aujourd'hui : comment les tokens réconcilient enfin designers et développeurs dans l'industrialisation de la conception.",
      en: "From the 1990s to today: how tokens finally reconcile designers and developers in the industrialization of design.",
    },
    image: "/articles/systeme-de-tokens.jpg",
  },
  {
    slug: "designops-outils-workflows",
    title: {
      fr: "Comment le DesignOps nous donne les clefs pour concevoir les outils et les workflows adaptés à nos besoins ?",
      en: "DesignOps to support the industrialization of your design processes",
    },
    kicker: { fr: "Ops et Automatisation", en: "Ops and Automation" },
    tags: ["Automation", "DesignOps"],
    lede: {
      fr: "Les outils sont aux équipes ce qu'est l'huile pour le moteur : des facilitateurs de transfert, jamais des objectifs en soi.",
      en: "Tools are to a team what oil is to an engine: facilitators of transfer, never goals in themselves.",
    },
    image: "/articles/designops-outils-workflows.jpg",
  },
];

// « Comment le Design peut répondre aux enjeux actuels des entreprises ? » n'est
// pas affiché : la maquette compose quatre cards. Sa fiche demeure dans
// knowledge/content-library/, donc le bot continue de pouvoir en parler.

/** Les deux premiers articles occupent les grandes cards de la maquette. */
export const FEATURED_COUNT = 2;

export const LINKS = {
  linkedin: "https://www.linkedin.com/in/arthur-mathon/",
  email: "mailto:a.mathon@stratecollege.fr",
};

/** Illustration du héro, par persona (exportée de la maquette Figma). */
export const HERO_IMAGES: Record<string, string> = {
  ours: "/hero/ours.png",
  corneille: "/hero/corneille.png",
  libellule: "/hero/libellule.png",
};
