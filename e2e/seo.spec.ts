import { expect, test } from "@playwright/test";

/**
 * Métadonnées de partage et d'indexation.
 *
 * Elles ne se voient pas à l'écran : rien ne signale qu'une image d'aperçu est
 * cassée ou qu'un `og:url` pointe ailleurs, sinon un lien partagé qui s'affiche
 * nu. C'est exactement la classe de défauts que cette session a appris à
 * traquer — invisible à l'usage, donc à vérifier par la mesure.
 */

const ARTICLE = "/articles/roi-design-system";

/** Contenu d'une balise `<meta>`, par `property` ou par `name`. */
async function meta(page: import("@playwright/test").Page, cle: string) {
  return page
    .locator(`meta[property="${cle}"], meta[name="${cle}"]`)
    .first()
    .getAttribute("content");
}

test.describe("Partage et indexation", () => {
  test("l'accueil porte un aperçu complet", async ({ page }) => {
    await page.goto("/");
    expect(await meta(page, "og:title")).toContain("Arthur Mathon");
    expect(await meta(page, "og:description")).toBeTruthy();
    expect(await meta(page, "og:type")).toBe("website");
    expect(await meta(page, "og:site_name")).toContain("Arthur Mathon");

    /*
      L'image doit être **absolue** : aucun réseau social ne va chercher une URL
      relative. C'est le rôle de `metadataBase`, et le seul moyen de le vérifier
      est de lire ce qui est réellement servi.
    */
    const image = await meta(page, "og:image");
    expect(image).toMatch(/^https?:\/\//);
    expect(await meta(page, "twitter:card")).toBe("summary_large_image");
  });

  test("un article porte le sien, avec son propre visuel", async ({ page }) => {
    await page.goto(ARTICLE);
    expect(await meta(page, "og:type")).toBe("article");
    expect(await meta(page, "og:title")).toContain("ROI");
    // Le visuel de l'article, pas celui du site : un aperçu partagé montre ce
    // que le lecteur retrouvera en arrivant.
    expect(await meta(page, "og:image")).toContain("roi-design-system");
    expect(await meta(page, "og:url")).toContain(ARTICLE);
  });

  test("chaque image d'aperçu existe vraiment", async ({ page, request }) => {
    for (const url of ["/", ARTICLE]) {
      await page.goto(url);
      const image = await meta(page, "og:image");
      expect(image, `${url} : pas d'og:image`).toBeTruthy();
      // Une image annoncée mais absente donne un aperçu nu, sans rien signaler.
      const reponse = await request.get(image!);
      expect(reponse.status(), `${url} → ${image}`).toBe(200);
    }
  });

  test("le plan du site liste l'accueil et les six articles", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(urls).toHaveLength(7);
    expect(urls.filter((u) => u.includes("/articles/"))).toHaveLength(6);
    // La page d'atelier n'est pas du site publié.
    expect(urls.some((u) => u.includes("/dev/"))).toBe(false);
  });

  test("robots.txt ouvre le site et ferme l'atelier et l'API", async ({ request }) => {
    const txt = await (await request.get("/robots.txt")).text();
    expect(txt).toContain("Allow: /");
    expect(txt).toContain("Disallow: /dev/");
    // Un robot n'a pas à consommer le quota du modèle à chaque visite.
    expect(txt).toContain("Disallow: /api/");
    expect(txt).toMatch(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/);
  });

  test("les données structurées disent qui est Arthur", async ({ page }) => {
    await page.goto("/");
    const brut = await page.locator('script[type="application/ld+json"]').first().textContent();
    const donnees = JSON.parse(brut!);
    const personne = donnees["@graph"].find((n: { "@type": string }) => n["@type"] === "Person");
    expect(personne.name).toBe("Arthur Mathon");
    expect(personne.jobTitle).toBeTruthy();
    expect(personne.sameAs).toContain("https://www.linkedin.com/in/arthur-mathon/");
  });

  test("un article se rattache à son auteur", async ({ page }) => {
    await page.goto(ARTICLE);
    const brut = await page.locator('script[type="application/ld+json"]').first().textContent();
    const donnees = JSON.parse(brut!);
    expect(donnees["@type"]).toBe("Article");
    expect(donnees.headline).toContain("ROI");
    expect(donnees.author.name).toBe("Arthur Mathon");
    // Même `@id` que la personne de l'accueil : c'est ce qui relie les pages
    // entre elles au lieu d'en faire des textes indépendants.
    expect(donnees.author["@id"]).toContain("#arthur");
  });
});
