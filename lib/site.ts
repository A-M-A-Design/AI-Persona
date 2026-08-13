/**
 * Identité publique du site, en un seul endroit.
 *
 * L'URL est la seule valeur qui change entre les environnements, et elle est
 * indispensable dès qu'on parle de partage : une image d'aperçu doit être
 * désignée en **absolu**, aucun réseau social n'allant chercher une URL
 * relative. C'est le rôle de `metadataBase` dans Next, qui préfixe alors tout
 * le reste.
 *
 * Ordre de résolution :
 *
 * 1. `NEXT_PUBLIC_SITE_URL`, si on la pose — c'est le domaine définitif ;
 * 2. `VERCEL_PROJECT_PRODUCTION_URL`, que la plateforme fournit d'office : les
 *    aperçus fonctionnent donc dès le premier déploiement, sans configuration ;
 * 3. `localhost`, pour le développement.
 *
 * Le repli local n'est pas anodin : sans lui, Next avertit à chaque build et
 * les URL absolues seraient calculées depuis une base vide.
 */
function resoudreUrl(): string {
  const explicite = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicite) return explicite.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_URL = resoudreUrl();

/** Le nom qui apparaît dans un aperçu de partage, distinct du titre de page. */
export const SITE_NAME = "Arthur Mathon — AI Persona";

export const AUTEUR = {
  nom: "Arthur Mathon",
  role: "Design System Lead / Product / Ops",
  linkedin: "https://www.linkedin.com/in/arthur-mathon/",
};

/** URL absolue à partir d'un chemin du site. */
export function urlAbsolue(chemin: string): string {
  return new URL(chemin, SITE_URL).toString();
}
