import type { MetadataRoute } from "next";
import { ARTICLES, articlePath } from "@/lib/articles";
import { SITE_URL } from "@/lib/site";

/**
 * Plan du site. Sept URL : l'accueil et les six articles.
 *
 * `/dev/kit` en est absent, et c'est délibéré — c'est une page d'atelier, hors
 * du site publié. `robots.ts` l'exclut aussi, les deux devant dire la même
 * chose : un plan qui annonce une page que `robots` interdit est une
 * contradiction que les outils d'indexation signalent.
 *
 * Pas de `lastModified` inventé : le tableau `ARTICLES` ne porte pas de date, et
 * une date fausse vaut moins que pas de date du tout — un moteur qui la croit
 * revient pour rien, ou ne revient pas quand il faudrait.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...ARTICLES.map((a) => ({
      url: new URL(articlePath(a.slug), SITE_URL).toString(),
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
