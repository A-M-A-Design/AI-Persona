import { expect, test } from "@playwright/test";
import { openChat, PERSONAS, stubChat, visit } from "./helpers";

test.describe("Accueil", () => {
  test("rend le héro, les quatre cards et la carte contact", async ({ page }) => {
    await visit(page);
    await expect(page.locator(".hero__title")).toBeVisible();
    await expect(page.locator(".article-card")).toHaveCount(4);
    await expect(page.locator(".connect-card")).toBeVisible();
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
    await page.locator(".site-header__toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  });
});
