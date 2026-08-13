import { expect, test } from "@playwright/test";
import { visit } from "./helpers";

/**
 * Accès rapide — ce que le lecteur d'écran rencontre en premier.
 *
 * Issu d'une passe au lecteur d'écran (2026-08-13) : à l'ouverture, rien ne
 * disait ce qu'est ce site, et les raccourcis à touche unique n'atteignent pas
 * un lecteur d'écran en mode exploration — il réserve les lettres à sa propre
 * navigation. Les mêmes destinations sont donc offertes en contrôles réels.
 *
 * L'ordre est vérifié sur le **document**, pas sur la tabulation : c'est
 * l'ordre de lecture en exploration, celui qui décide de ce qu'on entend en
 * arrivant. Les deux coïncident ici, et rien ne garantit qu'ils coïncideront
 * toujours.
 */
test.describe("Accès rapide", () => {
  test("le nom du site est le premier texte du document", async ({ page }) => {
    await visit(page);
    const premier = await page.evaluate(() => {
      const marcheur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = marcheur.nextNode())) {
        const texte = n.textContent?.trim();
        // Le script anti-flash est un nœud texte lui aussi, et n'est pas lu.
        if (texte && n.parentElement?.tagName !== "SCRIPT") return texte;
      }
      return null;
    });
    expect(premier).toMatch(/Arthur Mathon/);
  });

  test("puis la question, puis les articles, puis le contenu", async ({ page }) => {
    await visit(page);
    const ordre = await page
      .locator(".quick-access .skip-link")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(ordre).toEqual(["#question", "#articles", "#contenu"]);
  });

  test("« Poser une question » met le focus dans le champ", async ({ page }) => {
    await visit(page);
    await page.locator('.skip-link[href="#question"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#question")).toBeFocused();
  });

  test("« Voir les articles » mène à la grille", async ({ page }) => {
    await visit(page);
    await page.locator('.skip-link[href="#articles"]').focus();
    await page.keyboard.press("Enter");
    // Le focus va sur la section, pas seulement la vue : sans cela la
    // tabulation suivante repartirait du haut de la page.
    await expect(page.locator("#articles")).toBeFocused();
    expect(page.url()).toContain("#articles");
  });

  test("la page article n'offre que le contenu", async ({ page }) => {
    await page.goto("/articles/roi-design-system");
    await page.waitForLoadState("networkidle");
    const ordre = await page
      .locator(".quick-access .skip-link")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    // Ni lanceur ni grille sur cette page : un raccourci vers une cible
    // absente ne mènerait nulle part.
    expect(ordre).toEqual(["#contenu"]);
  });

  test("l'accès rapide est un repère nommé", async ({ page }) => {
    await visit(page);
    await expect(
      page.getByRole("navigation", { name: /Accès rapide|Quick access/ }),
    ).toBeAttached();
  });

  test("les commandes flottantes sont centrées sur la barre", async ({ page }) => {
    await visit(page);
    await page.keyboard.press("Tab");
    // La transition dure 150 ms : on la laisse se poser avant de mesurer.
    await page.waitForTimeout(300);
    const ecart = await page.evaluate(() => {
      const l = document.querySelector(".skip-link:focus")?.getBoundingClientRect();
      const n = document.querySelector(".site-nav__inner")?.getBoundingClientRect();
      if (!l || !n) return null;
      return Math.round(l.top + l.height / 2 - (n.top + n.height / 2));
    });
    // Elles se collaient au bord haut (8 px), soit 10 px trop haut en desktop.
    expect(ecart).toBe(0);
  });

  test("« Poser une question » ne cache pas le champ sous la barre collante", async ({
    page,
  }) => {
    await visit(page);
    await page.locator('.skip-link[href="#question"]').focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(700);

    const r = await page.evaluate(() => {
      const champ = document.querySelector("#question")!.getBoundingClientRect();
      const panneau = document.querySelector(".launcher--hero")!.getBoundingClientRect();
      const barre = document.querySelector(".site-nav__inner")!.getBoundingClientRect();
      return {
        champSousLaBarre: champ.top >= barre.bottom,
        champDansLaFenetre: champ.bottom <= innerHeight,
        panneauEntier: panneau.top >= barre.bottom,
      };
    });
    /*
      Sans `scroll-margin-top`, l'ancre posait la cible à `top: 0` — donc
      **sous** la barre collante, invisible, pendant que l'écran montrait les
      articles. Le panneau entier doit arriver avec le champ : y atterrir seul,
      au milieu d'un aplat sombre, ne dit pas où l'on est.
    */
    expect(r.champSousLaBarre).toBe(true);
    expect(r.champDansLaFenetre).toBe(true);
    expect(r.panneauEntier).toBe(true);
  });
});
