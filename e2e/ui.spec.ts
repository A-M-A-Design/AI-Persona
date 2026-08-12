import { expect, test } from "@playwright/test";
import { MODES, openChat, PERSONAS, stubChat, visit } from "./helpers";

test.describe("Accueil", () => {
  test("rend le héro et les six cards, sans carte contact", async ({ page }) => {
    await visit(page);
    await expect(page.locator(".slideshow__slide:not([inert]) .slideshow__title")).toBeVisible();
    await expect(page.locator(".article-card")).toHaveCount(6);

    // Le contact a quitté la grille : il vit dans le pied de page, présent
    // sur toutes les pages.
    await expect(page.locator(".connect-card")).toHaveCount(0);
    await expect(page.locator(".site-footer")).toBeVisible();
  });

  test("le bouton d'envoi est inactif au repos et n'écoute pas le survol", async ({ page }) => {
    // `aria-disabled` et non `disabled` : le bouton reste dans l'ordre de
    // tabulation, donc annonçable, mais refuse l'envoi et ignore le pointeur.
    await visit(page);
    const button = page.locator(".launcher__row button[type=submit]");
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button).toHaveCSS("pointer-events", "none");

    await page.locator(".launcher__row input").fill("Bonjour");
    await expect(button).toHaveAttribute("aria-disabled", "false");
  });

  test("le libellé du bouton inactif reste lisible", async ({ page }) => {
    // L'opacité 0.38 du WDS ramenait le libellé à 1,25:1.
    await visit(page);
    const opacity = await page
      .locator(".launcher__row button[type=submit]")
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBe(1);
  });
});

test.describe("Panneau de conversation", () => {
  test.beforeEach(async ({ page }) => {
    await stubChat(page);
  });

  test("s'ouvre à l'envoi et affiche la question posée", async ({ page }) => {
    await visit(page);
    await openChat(page, "Raconte-moi ton parcours");
    await expect(page.locator(".chat-modal__title")).toHaveText("Arthur Mathon");
    await expect(page.locator(".chat-modal__question")).toHaveText("Raconte-moi ton parcours");
    await expect(page.locator(".chat-modal__answer")).toContainText("Réponse simulée");
  });

  test("le bouton « nouvelle conversation » vide le fil et rend les questions", async ({ page }) => {
    await visit(page);
    const chipsBefore = await page.locator(".launcher__suggestions .wel-chip").count();

    await openChat(page, "Raconte-moi ton parcours");
    const reset = page.locator(".chat-modal__new");
    await expect(reset).toBeVisible();

    await reset.click();
    await expect(page.locator(".chat-modal__question")).toHaveCount(0);
    await expect(reset).toHaveCount(0); // rien à effacer : le bouton disparaît
    await expect(page.locator(".chat-modal__chips .wel-chip")).toHaveCount(chipsBefore);
  });

  test("le fil défile quand il dépasse la hauteur du panneau", async ({ page }) => {
    // Régression : justify-content: flex-end faisait déborder le contenu
    // au-dessus de la zone scrollable, hors d'atteinte.
    await stubChat(page, "Réponse longue. ".repeat(400));
    await visit(page);
    await openChat(page);
    const body = page.locator(".chat-modal__body");
    const metrics = await body.evaluate((el) => ({
      scroll: el.scrollHeight,
      client: el.clientHeight,
      top: el.scrollTop,
    }));
    expect(metrics.scroll).toBeGreaterThan(metrics.client);
    // Le contenu doit être atteignable : on remonte puis on redescend.
    await body.evaluate((el) => { el.scrollTop = 0; });
    expect(await body.evaluate((el) => el.scrollTop)).toBe(0);
  });

  test("Échap ferme le panneau", async ({ page }) => {
    await visit(page);
    await openChat(page);
    await page.keyboard.press("Escape");
    await expect(page.locator(".chat-modal__panel")).toHaveCount(0);
  });
});

test.describe("Barre de navigation", () => {
  test("reste en haut au défilement", async ({ page }) => {
    await visit(page);
    const nav = page.locator(".site-nav");
    const avant = await nav.boundingBox();
    expect(avant?.y).toBe(0);

    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForFunction(() => window.scrollY > 400);

    const apres = await nav.boundingBox();
    expect(apres?.y).toBe(0);
    // Et les contrôles restent cliquables une fois la page défilée.
    await page.locator(".site-nav__toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  });

  test("le panneau de conversation recouvre la barre", async ({ page }) => {
    await stubChat(page);
    await visit(page);
    await openChat(page);
    const auDessus = await page.evaluate(() => {
      const nav = document.querySelector(".site-nav")!.getBoundingClientRect();
      const el = document.elementFromPoint(nav.right - 40, nav.height / 2);
      return el?.closest(".chat-modal") !== null;
    });
    expect(auDessus).toBe(true);
  });

  test("les contrôles ont la taille de la maquette", async ({ page }, testInfo) => {
    // La maquette resserre la barre et ses contrôles en mobile : 64 px de haut
    // et des pastilles de 32, contre 80 et 40 aux largeurs supérieures.
    const mobile = testInfo.project.name === "mobile";
    await visit(page);

    const barre = await page.locator(".site-nav__inner").boundingBox();
    expect(Math.round(barre?.height ?? 0)).toBe(mobile ? 64 : 80);

    for (const sel of [".site-nav__chip", ".site-nav__toggle"]) {
      const box = await page.locator(sel).first().boundingBox();
      expect(Math.round(box?.height ?? 0), sel).toBe(mobile ? 32 : 40);
    }
  });
});

test.describe("Pied de page", () => {
  test("reste en bas au défilement", async ({ page }) => {
    await visit(page);
    const footer = page.locator(".site-footer");
    await expect(footer).toBeVisible();

    // Page longue : au repos comme après défilement, la barre touche le bas
    // de la fenêtre.
    const hauteur = page.viewportSize()!.height;
    const avant = await footer.boundingBox();
    expect(Math.round((avant?.y ?? 0) + (avant?.height ?? 0))).toBe(hauteur);

    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForFunction(() => window.scrollY > 400);

    const apres = await footer.boundingBox();
    expect(Math.round((apres?.y ?? 0) + (apres?.height ?? 0))).toBe(hauteur);
  });

  test("ne masque rien en bas de page", async ({ page }) => {
    // `sticky` et non `fixed` : arrivé en bas, le pied reprend sa place dans
    // le flux et le dernier contenu reste visible sous lui.
    await visit(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(
      () => window.innerHeight + window.scrollY >= document.body.scrollHeight - 2,
    );

    const derniere = await page.locator(".article-card").last().boundingBox();
    const footer = await page.locator(".site-footer").boundingBox();
    expect((derniere?.y ?? 0) + (derniere?.height ?? 0)).toBeLessThanOrEqual(
      (footer?.y ?? 0) + 1,
    );
  });

  test("a la hauteur de la maquette", async ({ page }) => {
    // 64 px à toutes les largeurs, contrairement à la barre de navigation qui
    // descend de 80 à 64 en mobile. Les deux boutons gardent leurs 40 px.
    await visit(page);

    const barre = await page.locator(".site-footer__inner").boundingBox();
    expect(Math.round(barre?.height ?? 0)).toBe(64);

    for (const lien of await page.locator(".site-footer__link").all()) {
      const box = await lien.boundingBox();
      expect(Math.round(box?.height ?? 0)).toBe(40);
    }
  });

  for (const persona of PERSONAS) {
    test(`${persona} — le titre tient dans la barre`, async ({ page }) => {
      // La police d'affichage de la libellule est une pixel font à chasse
      // fixe : à la taille du token, « Discutons ! » faisait deux fois la
      // largeur du même texte en Fraunces et écrasait les deux boutons.
      await visit(page, { persona });

      const boites = await page.evaluate(() => {
        const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const inner = document.querySelector(".site-footer__inner")!;
        const cs = getComputedStyle(inner);
        const dispo =
          r(".site-footer__inner").width -
          parseFloat(cs.paddingLeft) -
          parseFloat(cs.paddingRight);
        return {
          dispo,
          contenu: r(".site-footer__title").width + r(".site-footer__links").width + 16,
          hauteurTitre: r(".site-footer__title").height,
          barre: r(".site-footer__inner").height,
        };
      });

      // Tenir tout juste ne suffit pas : à la taille du token, la libellule
      // laissait 15 px de marge sur 343 en mobile — le titre touchait presque
      // les boutons. On exige un pas de grille de respiration.
      expect(boites.dispo - boites.contenu).toBeGreaterThanOrEqual(32);
      expect(boites.hauteurTitre).toBeLessThanOrEqual(boites.barre);
    });
  }

  test("expose les deux liens de contact", async ({ page }) => {
    await visit(page);
    const liens = page.locator(".site-footer__link");
    await expect(liens).toHaveCount(2);
    await expect(liens.nth(0)).toHaveAttribute("href", /linkedin\.com/);
    await expect(liens.nth(1)).toHaveAttribute("href", /^mailto:/);

    // Les icônes sont des <svg> : un caractère texte s'effondrerait à 0.
    for (const svg of await page.locator(".site-footer__link svg").all()) {
      const box = await svg.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThan(8);
      expect(box?.height ?? 0).toBeGreaterThan(8);
    }
  });
});

test.describe("Lanceur", () => {
  test("mobile : action compacte, chips défilantes", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "spécifique au breakpoint mobile");
    await visit(page);

    // La ligne reste horizontale et le libellé du bouton est masqué.
    await expect(page.locator(".launcher__row")).toHaveCSS("flex-direction", "row");
    await expect(page.locator(".launcher__row .composer__label")).toBeHidden();
    // Le nom accessible du bouton survit au masquage du libellé.
    await expect(page.locator(".launcher__row button[type=submit]")).toHaveAttribute(
      "aria-label",
      /.+/,
    );

    // Les chips défilent au lieu de passer à la ligne, avec le bouton de
    // défilement de la maquette au bout de la rangée.
    const chips = page.locator(".launcher__suggestions");
    await expect(chips).toHaveCSS("flex-wrap", "nowrap");
    const scrolls = await chips.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(scrolls).toBe(true);
    await expect(page.locator(".suggestions__next")).toBeVisible();

    // Un masque estompe la rangée sous le bouton, et disparaît avec lui une
    // fois la fin atteinte : sinon les chips passent derrière en restant nettes.
    await expect(chips).toHaveCSS("mask-image", /linear-gradient/);
    await chips.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await expect(page.locator(".suggestions__next")).toHaveCount(0);
    await expect(chips).toHaveCSS("mask-image", "none");
  });

  test("mobile : champ en pilule, flèche à l'intérieur", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "spécifique au breakpoint mobile");
    await visit(page);

    // Le panneau fait 343 sur une base de 375, et son retrait de 28 laisse
    // 287 au champ — les valeurs de la maquette v2.
    const field = await page.locator(".launcher__row .wel-input-text__wrapper").boundingBox();
    const panneau = await page.locator(".launcher--hero").boundingBox();
    expect(Math.round(panneau?.width ?? 0)).toBe(343);
    expect(Math.round(field?.width ?? 0)).toBe(287);

    // Le champ est une pilule, et l'action est posée dedans — pas à côté.
    await expect(page.locator(".launcher__row .wel-input-text__wrapper")).toHaveCSS(
      "border-radius",
      "100px",
    );
    const button = await page.locator(".launcher__row button[type=submit]").boundingBox();
    const fieldRight = (field?.x ?? 0) + (field?.width ?? 0);
    const buttonRight = (button?.x ?? 0) + (button?.width ?? 0);
    expect(buttonRight).toBeLessThanOrEqual(fieldRight);
    expect(button?.x ?? 0).toBeGreaterThan(field?.x ?? 0);
  });

  test("le panneau garde son aplat à toutes les largeurs", async ({ page }) => {
    // La v1 le faisait disparaître en mobile ; la v2 le pose sur l'image, il
    // lui faut donc un fond tenu partout, sinon le texte est illisible.
    await visit(page);
    const launcher = page.locator(".launcher--hero");
    await expect(launcher).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(page.locator(".launcher__heading")).toBeVisible();
  });
});

test.describe("Thèmes", () => {
  for (const persona of PERSONAS) {
    test(`${persona} — le texte des cards reste clair en mode sombre`, async ({ page }) => {
      // Régression : on-primary s'inverse d'un mode à l'autre, ce qui rendait
      // le titre quasi noir sur le voile foncé.
      await visit(page, { persona, mode: "dark" });
      const color = await page
        .locator(".article-card__title")
        .first()
        .evaluate((el) => getComputedStyle(el).color);
      const [r, g, b] = color.match(/\d+/g)!.map(Number);
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      expect(luminance).toBeGreaterThan(0.6);
    });
  }

  test("libellule — les titres de card ne débordent pas", async ({ page }) => {
    await visit(page, { persona: "libellule" });
    const cards = page.locator(".article-card");
    for (let i = 0; i < (await cards.count()); i++) {
      const card = cards.nth(i);
      const overflow = await card.evaluate((el) => {
        const content = el.querySelector(".article-card__content") as HTMLElement;
        return content.getBoundingClientRect().height - el.getBoundingClientRect().height;
      });
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });

  for (const persona of PERSONAS) {
    test(`${persona} — le visuel du héro diffère entre clair et sombre`, async ({ page }) => {
      const source = async () =>
        decodeURIComponent(
          await page.locator(".slideshow__slide:not([inert]) img").evaluate((el: HTMLImageElement) => el.currentSrc),
        );

      await visit(page, { persona, mode: "light" });
      const clair = await source();
      await visit(page, { persona, mode: "dark" });
      const sombre = await source();

      expect(clair).toContain(`/hero/${persona}-light.`);
      expect(sombre).toContain(`/hero/${persona}-dark.`);
      // Les deux visuels sont chargés, pas seulement référencés.
      const charge = await page
        .locator(".slideshow__slide:not([inert]) img")
        .evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0);
      expect(charge).toBe(true);
    });
  }

  for (const mode of MODES) {
    test(`${mode} — le bouton de défilement des chips garde un contour visible`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile", "le bouton ne sert qu'en mobile");
      await visit(page, { mode });

      // Régression : le fond du bouton valait celui de la page et l'ombre
      // portée est invisible sur fond sombre — il ne restait que le chevron,
      // sans forme ni rayon perceptibles.
      const vu = await page.locator(".suggestions__next").evaluate((el) => {
        const c = getComputedStyle(el);
        return {
          fond: c.backgroundColor,
          page: getComputedStyle(document.body).backgroundColor,
          radius: c.borderRadius,
          bordure: c.borderStyle,
        };
      });
      expect(vu.fond).not.toBe(vu.page);
      expect(vu.bordure).toBe("solid");
      expect(vu.radius).toBe("100px");
    });
  }

  test("le visuel du héro suit la bascule de mode sans rechargement", async ({ page }) => {
    await visit(page, { mode: "light" });
    const image = page.locator(".slideshow__slide:not([inert]) img");
    const avant = await image.evaluate((el: HTMLImageElement) => el.currentSrc);

    await page.locator(".site-nav__toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
    await expect
      .poll(async () => image.evaluate((el: HTMLImageElement) => el.currentSrc))
      .not.toBe(avant);
  });

  test("le sélecteur de mode bascule l'attribut de la page", async ({ page }) => {
    await visit(page);
    await expect(page.locator("html")).toHaveAttribute("data-color-mode", "light");
    await page.locator(".site-nav__toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  });
});
