import { expect, test } from "@playwright/test";
import { visit } from "./helpers";

const SLUG = "roi-design-system";

// Largeur de la colonne de lecture par projet, telle que dessinée dans la
// maquette. En mobile, l'article occupe toute la largeur disponible —
// 375 moins les deux retraits de 32 px imbriqués.
const COLUMN = { desktop: 850, tablet: 550, mobile: 311 };

/** Articles publiés — le carousel en propose tous sauf celui qu'on lit. */
const ARTICLE_COUNT = 6;

/**
 * Attente des changements d'URL. En développement la route cible est compilée
 * à la demande, et les quatre projets sollicitent le même serveur en
 * parallèle : le défaut de 5 s expirait sur une navigation pourtant en vol.
 */
const NAVIGATION = 15_000;

/** Ouvre une page article en appliquant les réglages avant le premier rendu. */
async function visitArticle(page: import("@playwright/test").Page, lang = "fr", slug = SLUG) {
  await page.addInitScript(
    (l) => {
      localStorage.setItem(
        "ai-persona:settings",
        JSON.stringify({ persona: "ours", colorMode: "light", lang: l }),
      );
    },
    lang,
  );
  await page.goto(`/articles/${slug}`);
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
    const el = document.querySelector(".site-nav .site-nav__home");
    return Boolean(el && Object.keys(el).some((k) => k.startsWith("__react")));
  });
}

test.describe("Cards de l'accueil", () => {
  test("mènent aux pages du site et non à LinkedIn", async ({ page }) => {
    await visit(page);
    const cards = page.locator(".article-card");
    await expect(cards).toHaveCount(ARTICLE_COUNT);

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
    // Marge large : en développement, la route cible est compilée à la
    // demande, et les quatre projets sollicitent le même serveur en parallèle.
    // Le défaut de 5 s expire alors sur une navigation pourtant en cours.
    await expect(page).toHaveURL(new RegExp(`${href}$`), { timeout: NAVIGATION });
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
    // On mesure le texte lui-même : en mobile la colonne tient sa largeur d'un
    // retrait interne, pas d'une largeur maximale.
    const width = (await page.locator(".article__title").boundingBox())?.width;
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
    const count = async () => ({
      h2: await page.locator(".article__h2").count(),
      li: await page.locator(".article__list li").count(),
      // Le compte des paragraphes est ce qui révèle une ligne parasite : la
      // ligne de crédit anglaise s'affichait en tête du corps traduit.
      p: await page.locator(".article__body p").count(),
    });
    await visitArticle(page, "fr");
    const fr = await count();
    await visitArticle(page, "en");
    expect(await count()).toEqual(fr);
  });

  test("la ligne de crédit ne s'affiche dans aucune des deux langues", async ({ page }) => {
    for (const lang of ["fr", "en"]) {
      await visitArticle(page, lang);
      const body = await page.locator(".article__body").innerText();
      expect(body).not.toContain("Article rédigé par");
      expect(body).not.toContain("Article written by");
    }
  });

  // Les idées clés vivent en tête du markdown, pour le seul prompt du bot
  // (lib/prompt.ts les injecte à la place des ~56 ko de corps). C'est ce qui
  // permet de tenir « un article n'existe qu'en un seul exemplaire » sans
  // transporter le texte intégral à chaque requête — mais le lecteur, lui, ne
  // doit jamais voir cette ligne. Ce test est la contrepartie du compromis.
  test("la ligne d'idées clés reste réservée au prompt, jamais affichée", async ({ page }) => {
    for (const slug of ["roi-design-system", "systeme-de-tokens"]) {
      for (const lang of ["fr", "en"]) {
        await visitArticle(page, lang, slug);
        const body = await page.locator(".article__body").innerText();
        expect(body).not.toContain("Idées clés");
        expect(body).not.toContain("Key ideas");
      }
    }
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

test.describe("Carousel de fin d'article", () => {
  // Le carousel prend toute la largeur de contenu — la fenêtre moins les
  // marges de page (64 / 32 / 16) — là où la colonne de lecture est resserrée.
  // La largeur « tablette » de Playwright est 1000, la maquette en dessine 768 :
  // la mise en page est fluide, la relation reste la même.
  const FULL = { desktop: 1440 - 2 * 64, tablet: 1000 - 2 * 32, mobile: 375 - 2 * 16 };

  test("occupe la pleine largeur et exclut l'article en cours", async ({ page }, testInfo) => {
    await visitArticle(page);
    const carousel = page.locator(".carousel");
    await expect(carousel).toBeVisible();

    const width = (await carousel.boundingBox())?.width;
    expect(Math.round(width ?? 0)).toBe(FULL[testInfo.project.name as keyof typeof FULL]);

    // Tous les autres articles, jamais celui qu'on lit.
    const cards = page.locator(".carousel .article-card");
    await expect(cards).toHaveCount(ARTICLE_COUNT - 1);
    for (const card of await cards.all()) {
      expect(await card.getAttribute("href")).not.toBe(`/articles/${SLUG}`);
    }
  });

  test("la pagination compte les pages, pas les cartes", async ({ page }, testInfo) => {
    await visitArticle(page);
    // La forme visible est « 1 / 5 » ; le compteur porte en plus une phrase
    // masquée à destination des lecteurs d'écran, d'où le ciblage du span.
    const counter = page.locator(".carousel__counter [aria-hidden=true]");
    const annonce = page.locator(".carousel__counter .a11y-hidden");

    // Cartes visibles par page : 3 en desktop, 2 en tablette, 1 en mobile.
    const perPage = { desktop: 3, tablet: 2, mobile: 1 }[testInfo.project.name] ?? 1;
    const pages = Math.ceil((ARTICLE_COUNT - 1) / perPage);
    await expect(counter).toHaveText(`1 / ${pages}`);
    await expect(annonce).toHaveText(`Page 1 sur ${pages}`);

    const [prev, next] = [
      page.locator(".carousel__step").first(),
      page.locator(".carousel__step").last(),
    ];
    await expect(prev).toBeDisabled();
    await next.click();
    await expect(counter).toHaveText(`2 / ${pages}`);
    await expect(prev).toBeEnabled();
  });

  test("une card sans visuel garde un texte lisible", async ({ page }) => {
    await visitArticle(page);

    // Le contenu des cards est toujours composé en mode sombre, pour tenir sur
    // une photo. Sans image dessous, il lui faut un aplat sombre : autrement le
    // titre se retrouve clair sur la surface claire de la page.
    const contrast = await page.evaluate(() => {
      const card = [...document.querySelectorAll(".carousel .article-card")].find(
        (c) => !c.querySelector("img"),
      );
      if (!card) return null;
      const title = card.querySelector(".article-card__title") as HTMLElement;
      const body = card.querySelector(".article-card__body") as HTMLElement;
      const parse = (v: string) => (v.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const lum = (rgb: number[]) => {
        const [r, g, bl] = rgb.map((c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      };
      const a = lum(parse(getComputedStyle(title).color));
      const b = lum(parse(getComputedStyle(body).backgroundColor));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });

    // Tous les articles ont un visuel aujourd'hui : le test se déclare ignoré
    // plutôt que de passer à vide, et reprendra son rôle au prochain article
    // publié sans image.
    test.skip(contrast === null, "aucun article sans visuel");
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  test("une carte du carousel ouvre son article", async ({ page }) => {
    await visitArticle(page);
    const card = page.locator(".carousel .article-card").first();
    const href = await card.getAttribute("href");
    await card.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`), { timeout: NAVIGATION });
  });
});

test.describe("Retour à l'accueil", () => {
  test("le bouton suit la lecture sans recouvrir le texte", async ({ page }) => {
    await visitArticle(page);
    const home = page.locator(".site-nav .site-nav__home");
    await expect(home).toBeVisible();

    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(200);
    const first = await home.boundingBox();
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(200);
    const second = await home.boundingBox();

    await expect(home).toBeVisible();
    expect(Math.abs((second?.y ?? 0) - (first?.y ?? 0))).toBeLessThan(2);

    // Il est porté par la barre, dont le fond est opaque : le texte passe
    // dessous. Ce qu'il faut vérifier, c'est qu'il reste au premier plan et
    // atteignable — quand la pilule était posée au-dessus de l'article, c'est
    // le texte qui lui passait par-dessus.
    const onTop = await page.evaluate(() => {
      const el = document.querySelector(".site-nav .site-nav__home");
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return el.contains(hit) || hit === el;
    });
    expect(onTop).toBe(true);
  });

  test("la pilule « Retour » a disparu au profit du bouton d'accueil", async ({ page }) => {
    await visitArticle(page);
    await expect(page.locator(".article-back")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Retour à l'accueil|Back to home/ })).toHaveCount(1);
  });

  test("l'accueil n'affiche pas le bouton", async ({ page }) => {
    // La variante à bouton d'accueil est propre aux pages articles.
    await visit(page);
    await expect(page.locator(".site-nav__home")).toHaveCount(0);
  });

  test("le bouton ramène à l'accueil", async ({ page }) => {
    await visitArticle(page);
    await page.locator(".site-nav .site-nav__home").click();
    await expect(page).toHaveURL(/\/$/, { timeout: NAVIGATION });
    await expect(page.locator(".slideshow__slide:not([inert]) .slideshow__title")).toBeVisible();
  });
});
