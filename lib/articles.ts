// Métadonnées des articles affichés dans la grille Articles (client-safe).
//
// L'ordre du tableau est l'ordre d'affichage : les deux premiers occupent les
// grandes cards carrées de la première grille, les suivants les cards étroites
// de la seconde — c'est la composition de la maquette Figma.
export type Article = {
  slug: string;
  title: string;
  /** Surtitre de la card, en capitales — « kicker » dans la maquette. */
  kicker: string;
  tags: string[];
  excerpt: string;
  /** Visuel de fond de la card. Absent = aplat de thème (pas de visuel dans la maquette). */
  image?: string;
  /** Absent = pas encore publié en ligne (ex. nouvelle version en cours). */
  href?: string;
};

const LINKEDIN_ARTICLES = "https://www.linkedin.com/in/arthur-mathon/recent-activity/articles/";

export const ARTICLES: Article[] = [
  {
    slug: "entreprise-traumatisee",
    title: "Comment remettre en mouvement une entreprise traumatisée ?",
    kicker: "Société",
    tags: ["DesignOps", "OrgDesign", "Recherche"],
    excerpt:
      "Trauma organisationnel, résilience et tenségrité : ce que les neurosciences et le vivant nous apprennent pour libérer une organisation figée.",
    image: "/articles/entreprise-traumatisee.jpg",
  },
  {
    slug: "roi-design-system",
    title: "Comment mesurer le ROI d'un Design Système ?",
    kicker: "Ops et Design System",
    tags: ["Business", "DesignSystem"],
    excerpt:
      "Indicateurs qualitatifs et quantitatifs, KPI à suivre : rendre tangible la valeur d'un design system auprès du comité exécutif.",
    image: "/articles/roi-design-system.jpg",
    href: LINKEDIN_ARTICLES,
  },
  {
    slug: "systeme-de-tokens",
    title: "Pourquoi et comment créer un système de tokens applicable à vos produits digitaux",
    kicker: "Design System et Product",
    tags: ["DesignSystem", "Product"],
    excerpt:
      "Des années 1990 à aujourd'hui : comment les tokens réconcilient enfin designers et développeurs dans l'industrialisation de la conception.",
    image: "/articles/systeme-de-tokens.jpg",
    href: LINKEDIN_ARTICLES,
  },
  {
    slug: "designops-outils-workflows",
    title: "Comment le DesignOps nous donne les clefs pour concevoir les outils et les workflows adaptés à nos besoins ?",
    kicker: "Ops et Automatisation",
    tags: ["Automation", "DesignOps"],
    excerpt:
      "Les outils sont aux équipes ce qu'est l'huile pour le moteur : des facilitateurs de transfert, jamais des objectifs en soi.",
    image: "/articles/designops-outils-workflows.jpg",
    href: LINKEDIN_ARTICLES,
  },
];

// « Comment le Design peut répondre aux enjeux actuels des entreprises ? » n'est
// pas affiché : la maquette compose quatre cards, et l'article reste accessible
// par le lien LinkedIn. Sa fiche demeure dans knowledge/content-library/, donc
// le bot continue de pouvoir en parler.

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
