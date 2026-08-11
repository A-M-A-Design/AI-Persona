// Métadonnées des articles affichés dans le bloc Articles (client-safe).
export type Article = {
  slug: string;
  title: string;
  tags: string[];
  excerpt: string;
  /** Absent = pas encore publié en ligne (ex. nouvelle version en cours). */
  href?: string;
};

const LINKEDIN_ARTICLES = "https://www.linkedin.com/in/arthur-mathon/recent-activity/articles/";

export const ARTICLES: Article[] = [
  {
    slug: "entreprise-traumatisee",
    title: "Comment remettre en mouvement une entreprise traumatisée ?",
    tags: ["DesignOps", "OrgDesign", "Recherche"],
    excerpt:
      "Trauma organisationnel, résilience et tenségrité : ce que les neurosciences et le vivant nous apprennent pour libérer une organisation figée.",
  },
  {
    slug: "design-enjeux-entreprises",
    title: "Comment le Design peut répondre aux enjeux actuels des entreprises ?",
    tags: ["Business", "DesignOps", "OrgDesign"],
    excerpt:
      "Une entreprise performante en 2024 n'est plus assurée de prospérer en 2025 — par la pensée systémique, le design peut développer la robustesse des organisations.",
    href: LINKEDIN_ARTICLES,
  },
  {
    slug: "roi-design-system",
    title: "Comment mesurer le ROI d'un Design Système ?",
    tags: ["Business", "DesignSystem"],
    excerpt:
      "Indicateurs qualitatifs et quantitatifs, KPI à suivre : rendre tangible la valeur d'un design system auprès du comité exécutif.",
    href: LINKEDIN_ARTICLES,
  },
  {
    slug: "systeme-de-tokens",
    title: "Pourquoi et comment créer un système de tokens applicable à vos produits digitaux",
    tags: ["DesignSystem", "Product"],
    excerpt:
      "Des années 1990 à aujourd'hui : comment les tokens réconcilient enfin designers et développeurs dans l'industrialisation de la conception.",
    href: LINKEDIN_ARTICLES,
  },
  {
    slug: "designops-outils-workflows",
    title: "Comment le DesignOps nous donne les clefs pour concevoir les outils et les workflows adaptés à nos besoins ?",
    tags: ["Automation", "DesignOps"],
    excerpt:
      "Les outils sont aux équipes ce qu'est l'huile pour le moteur : des facilitateurs de transfert, jamais des objectifs en soi.",
    href: LINKEDIN_ARTICLES,
  },
];

export const LINKS = {
  linkedin: "https://www.linkedin.com/in/arthur-mathon/",
  email: "mailto:a.mathon@stratecollege.fr",
};
