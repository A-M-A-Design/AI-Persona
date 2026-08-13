import { AUTEUR, SITE_NAME, SITE_URL, urlAbsolue } from "../lib/site";
import type { Article } from "../lib/articles";
import { articlePath } from "../lib/articles";

/**
 * Données structurées JSON-LD.
 *
 * Les métadonnées `og:` disent à un réseau social **comment afficher** un lien.
 * Le JSON-LD dit à un moteur **ce dont il s'agit** — ici, qu'un humain nommé
 * Arthur Mathon exerce un métier précis, et que ces pages sont ses articles.
 * C'est ce qui permet de relier le site à une personne plutôt qu'à une suite
 * de mots-clés, et c'est précisément l'objet d'un portfolio.
 *
 * Rendu côté serveur, dans un `<script type="application/ld+json">` : le format
 * n'est lu que par les robots, jamais affiché ni annoncé.
 *
 * Rien n'y est inventé. Tout ce qui figure ici existe déjà ailleurs dans le
 * site — nom, rôle, lien LinkedIn, titres et chapôs d'articles. Une donnée
 * structurée qui affirme plus que la page est une donnée fausse, et les moteurs
 * la sanctionnent.
 */

function Balise({ donnees }: { donnees: object }) {
  return (
    <script
      type="application/ld+json"
      // Le contenu est construit ici, à partir de constantes du dépôt : aucune
      // entrée utilisateur n'y transite.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees) }}
    />
  );
}

/** Accueil : la personne, et le site qui la présente. */
export function DonneesAccueil() {
  return (
    <Balise
      donnees={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Person",
            "@id": `${SITE_URL}#arthur`,
            name: AUTEUR.nom,
            jobTitle: AUTEUR.role,
            url: SITE_URL,
            sameAs: [AUTEUR.linkedin],
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}#site`,
            name: SITE_NAME,
            url: SITE_URL,
            inLanguage: "fr-FR",
            about: { "@id": `${SITE_URL}#arthur` },
          },
        ],
      }}
    />
  );
}

/** Page article : l'article, rattaché à son auteur. */
export function DonneesArticle({ article }: { article: Article }) {
  return (
    <Balise
      donnees={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title.fr,
        description: article.lede.fr,
        inLanguage: "fr-FR",
        url: urlAbsolue(articlePath(article.slug)),
        keywords: article.tags.join(", "),
        image: article.image ? urlAbsolue(article.image) : undefined,
        author: {
          "@type": "Person",
          "@id": `${SITE_URL}#arthur`,
          name: AUTEUR.nom,
          url: AUTEUR.linkedin,
        },
      }}
    />
  );
}
