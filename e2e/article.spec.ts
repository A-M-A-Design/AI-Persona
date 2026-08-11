import { expect, test } from "@playwright/test";
import { visit } from "./helpers";

const SLUG = "roi-design-system";

// Largeur de la colonne de lecture par projet, telle que dessinée dans la
// maquette. En mobile, l'article occupe toute la largeur disponible —
// 375 moins les deux retraits de 32 px imbriqués.
const COLUMN = { desktop: 850, tablet: 550, mobile: 311 };

/** Ouvre une page article en appliquant les réglages avant le premier rendu. */
async function visitArticle(page: import("@playwright/test").Page, lang = "fr") {
  await page.addInitScript(
    (l) => {
      localStorage.setItem(
        "ai-persona:settings",
        JSON.stringify({ persona: "ours", colorMode: "light", lang: l }),
      );
    },
    lang,
  );
  await page.goto(`/articles/${SLUG}`);
  await page.waitForLoadState("networkidle");
  await waitForHydration(page);
}

/**
 * Attend que React ait repris la main sur la barre de navigation.
 *
 * Entre le rendu serveur et l'hydratation, un clic sur un lien Next peut être
 * avalé : l'écouteur est posé mais le routeur n'est pas prêt, et la navigation
 * native n'a plus lieu. Sous charge, la fenêtre est assez large pour rendre le
 * test instable. La présence des propriétés internes de React sur le nœud est
 * le signal que l'hydratation est faite.
 */
async function waitForHydration(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector(".site-nav .article-back");
    return Boolean(el && Object.keys(el).some((k) => k.startsWith("__react")));
  });
}

test.describe("Cards de l'accueil", () => {
  test("mènent aux pages du site et non à LinkedIn", async ({ page }) => {
    await visit(page);
    const cards = page.locator(".article-card");
    await expect(cards).toHaveCount(4);

    for (const card of await cards.all()) {
      const href = await card.getAttribute("href");
      expect(href).toMatch(/^\/articles\//);
      // Lien interne : pas d'ouverture dans un nouvel onglet.
      expect(await card.getAttribute("target")).toBeNull();
    }
  });

  test("la card ouvre bien l'article correspondant", async ({ page }) => {
    await visit(page);
    const card = page.locator(".article-card").first();
    const href = await card.getAttribute("href");
    await card.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator(".article__title")).toBeVisible();
  });
});

test.describe("Page article", () => {
  test("rend le surtitre, le titre, le chapô et le corps", async ({ page }) => {
    await visitArticle(page);
    await expect(page.locator(".article__kicker")).toHaveText("Ops et Design System");
    await expect(page.locator(".article__title")).toContainText("ROI");
    await expect(page.locator(".article__lede")).toContainText("KPI");
    // Le corps vient du markdown : titres de section et listes doivent survivre
    // à la normalisation, sinon l'article redevient un mur de texte.
    expect(await page.locator(".article__h2").count()).toBeGreaterThan(2);
    expect(await page.locator(".article__list li").count()).toBeGreaterThan(5);
    expect(await page.locator(".article__body p").count()).toBeGreaterThan(2);
  });

  test("le titre dupliqué de l'export PDF n'apparaît pas dans le corps", async ({ page }) => {
    await visitArticle(page);
    const body = (await page.locator(".article__body").innerText()).toLowerCase();
    expect(body).not.toContain("comment mesurer le roi");
    expect(body).not.toContain("article rédigé par");
  });

  test("la colonne de lecture a la largeur de la maquette", async ({ page }, testInfo) => {
    await visitArticle(page);
    const width = (await page.locator(".article").boundingBox())?.width;
    expect(Math.round(width ?? 0)).toBe(COLUMN[testInfo.project.name as keyof typeof COLUMN]);
  });

  test("un slug inconnu renvoie une 404", async ({ page }) => {
    const res = await page.goto("/articles/slug-inexistant");
    expect(res?.status()).toBe(404);
  });

  test("l'anglais rend le corps traduit, sans avertissement", async ({ page }) => {
    await visitArticle(page, "en");
    await expect(page.locator(".article__kicker")).toHaveText("Ops and Design System");
    await expect(page.locator(".article__body")).toHaveAttribute("lang", "en");
    // L'avertissement ne sert qu'aux articles sans traduction.
    await expect(page.locator(".article__notice")).toHaveCount(0);

    const body = await page.locator(".article__body").innerText();
    expect(body).toContain("return on investment");
    expect(body).not.toContain("retour sur investissement");
  });

  test("les deux langues ont la même structure de corps", async ({ page }) => {
    await visitArticle(page, "fr");
    const fr = {
      h2: await page.locator(".article__h2").count(),
      li: await page.locator(".article__list li").count(),
    };
    await visitArticle(page, "en");
    expect(await page.locator(".article__h2").count()).toBe(fr.h2);
    expect(await page.locator(".article__list li").count()).toBe(fr.li);
  });

  test("aucun commentaire de relecture ne subsiste dans le corps", async ({ page }) => {
    for (const slug of ["designops-outils-workflows", "systeme-de-tokens"]) {
      for (const lang of ["fr", "en"]) {
        await page.addInitScript(
          (l) =>
            localStorage.setItem(
              "ai-persona:settings",
              JSON.stringify({ persona: "ours", colorMode: "light", lang: l }),
            ),
          lang,
        );
        await page.goto(`/articles/${slug}`);
        const body = await page.locator(".article__body").innerText();
        expect(body).not.toContain("Commented [");
        expect(body).not.toContain("Rajouter");
        expect(body).not.toContain("Revoir le titre");
      }
    }
  });
});

test.describe("Retour à l'accueil", () => {
  test("la pilule suit la lecture sans recouvrir le texte", async ({ page }) => {
    await visitArticle(page);
    const pill = page.locator(".site-nav .article-back");
    await expect(pill).toBeVisible();

    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(200);
    const first = await pill.boundingBox();
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(200);
    const second = await pill.boundingBox();

    await expect(pill).toBeVisible();
    expect(Math.abs((second?.y ?? 0) - (first?.y ?? 0))).toBeLessThan(2);

    // Elle est portée par la barre, dont le fond est opaque : le texte passe
    // dessous. Ce qu'il faut vérifier, c'est qu'elle reste au premier plan et
    // atteignable — quand elle était posée au-dessus de l'article, c'est le
    // texte qui lui passait par-dessus.
    const onTop = await page.evaluate(() => {
      const el = document.querySelector(".site-nav .article-back");
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return el.contains(hit) || hit === el;
    });
    expect(onTop).toBe(true);
  });

  test("un seul exemplaire de la pilule est exposé", async ({ page }) => {
    await visitArticle(page);
    await expect(page.getByRole("link", { name: /Retour/ })).toHaveCount(1);
  });

  test("la pilule ramène à l'accueil", async ({ page }) => {
    await visitArticle(page);
    await page.locator(".site-nav .article-back").click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".hero__title")).toBeVisible();
  });
});
