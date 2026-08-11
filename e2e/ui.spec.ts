import { expect, test } from "@playwright/test";
import { openChat, PERSONAS, stubChat, visit } from "./helpers";

test.describe("Accueil", () => {
  test("rend le héro, les six cards et la carte contact", async ({ page }) => {
    await visit(page);
    await expect(page.locator(".hero__title")).toBeVisible();
    await expect(page.locator(".article-card")).toHaveCount(6);
    await expect(page.locator(".connect-card")).toBeVisible();

    // La carte contact a quitté la grille étroite, que les articles occupent
    // désormais en entier : elle s'étend sous les deux grilles.
    await expect(page.locator(".articles--secondary .connect-card")).toHaveCount(0);
    const contact = await page.locator(".connect-card").boundingBox();
    const grid = await page.locator(".articles--secondary").boundingBox();
    expect(Math.round(contact?.width ?? 0)).toBe(Math.round(grid?.width ?? 0));
  });

  test("l'icône de la carte contact a une taille non nulle", async ({ page }) => {
    // Régression : .wel-icon-slot est en line-height 0 et attend un <svg>.
    // Un caractère texte s'y effondrait à une hauteur de 0.
    await visit(page);
    const box = await page.locator(".connect-card__icon svg").boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(20);
    expect(box?.height ?? 0).toBeGreaterThan(20);
  });

  test("le bouton d'envoi est inactif au repos et n'écoute pas le survol", async ({ page }) => {
    await visit(page);
    const button = page.locator(".launcher__row button[type=submit]");
    await expect(button).toBeDisabled();
    await expect(button).toHaveCSS("pointer-events", "none");
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
});

test.describe("Lanceur", () => {
  test("mobile : pas de carte, action compacte, chips défilantes", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "spécifique au breakpoint mobile");
    await visit(page);

    const launcher = page.locator(".launcher");
    await expect(launcher).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(launcher).toHaveCSS("box-shadow", "none");
    await expect(launcher).toHaveCSS("padding", "0px");

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
  });

  test("mobile : champ en pilule, flèche à l'intérieur, image pleine largeur", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "spécifique au breakpoint mobile");
    await visit(page);

    // La maquette met le champ et les chips en retrait de 16 px de plus que
    // l'illustration : 311 contre 343 sur une base de 375.
    const field = await page.locator(".launcher__row .wel-input-text__wrapper").boundingBox();
    const media = await page.locator(".hero__media").boundingBox();
    expect(Math.round(field?.width ?? 0)).toBe(311);
    expect(Math.round(media?.width ?? 0)).toBe(343);

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

    // Et le bloc ne déborde plus sur l'illustration.
    await expect(page.locator(".hero__media")).toHaveCSS("margin-top", "0px");
  });

  test("desktop : la carte déborde sur l'illustration", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "spécifique au breakpoint desktop");
    await visit(page);
    await expect(page.locator(".launcher")).not.toHaveCSS("box-shadow", "none");
    const margin = await page
      .locator(".hero__media")
      .evaluate((el) => parseFloat(getComputedStyle(el).marginTop));
    expect(margin).toBeLessThan(0);
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

  test("le sélecteur de mode bascule l'attribut de la page", async ({ page }) => {
    await visit(page);
    await expect(page.locator("html")).toHaveAttribute("data-color-mode", "light");
    await page.locator(".site-nav__toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  });
});
