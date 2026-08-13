import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Ce qu'un robot d'indexation a le droit de lire.
 *
 * Deux exclusions, et pas une de plus :
 *
 * - **`/dev/`** — la page kit est un atelier, pas une page du site. Elle
 *   n'apparaît dans aucun lien, mais un robot qui la trouverait indexerait une
 *   galerie de composants sous le nom d'Arthur.
 * - **`/api/`** — rien à y indexer, et la route de chat coûte un appel au
 *   modèle à chaque visite. Un robot n'a pas à consommer le quota.
 *
 * Le reste est ouvert : l'intérêt du site est justement d'être trouvé.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dev/", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
