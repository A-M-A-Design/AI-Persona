import { expect, test, type Page } from "@playwright/test";
import { openChat, stubChat, visit } from "./helpers";

// Le slideshow du héro : une slide par persona, et deux moyens de changer de
// persona qui doivent rester d'accord — le carrousel et le sélecteur de la
// barre. Les règles de lecture automatique sont celles du composant slideshow
// du WDS : départ à l'entrée dans la fenêtre, 5 s entre deux slides, boucle
// infinie.

/** Un tour de lecture, avec la marge nécessaire à l'animation de défilement. */
const TOUR = 6000;

// Ces tests attendent réellement plusieurs tours de 5 s. Le défaut de 30 s
// suffit en isolé mais expire quand les quatre projets sollicitent le même
// serveur de développement en parallèle.
test.describe.configure({ timeout: 90_000 });

const persona = (page: Page) =>
  page.evaluate(() => document.documentElement.getAttribute("data-persona"));

const enLecture = (page: Page) =>
  page.locator(".slideshow__play").getAttribute("aria-pressed");

test.describe("Slideshow", () => {
  test("une slide par persona, la première active", async ({ page }) => {
    await visit(page);
    await expect(page.locator(".slideshow__slide")).toHaveCount(3);
    // Les slides hors écran sont inertes : trois titres identiques annoncés à
    // la suite n'apprendraient rien à un lecteur d'écran.
    await expect(page.locator(".slideshow__slide:not([inert])")).toHaveCount(1);
  });

  test("la lecture automatique tourne et boucle", async ({ page }) => {
    await visit(page);
    expect(await enLecture(page)).toBe("true");
    expect(await persona(page)).toBe("ours");

    await page.waitForTimeout(TOUR);
    expect(await persona(page)).toBe("corneille");
    await page.waitForTimeout(TOUR);
    expect(await persona(page)).toBe("libellule");

    // Boucle infinie : la dernière slide ramène à la première.
    await page.waitForTimeout(TOUR);
    expect(await persona(page)).toBe("ours");
  });

  test("elle ne démarre qu'une fois le slideshow dans la fenêtre", async ({ page }) => {
    await visit(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const avant = await persona(page);
    await page.waitForTimeout(TOUR);
    expect(await persona(page), "hors écran, rien ne doit bouger").toBe(avant);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(TOUR);
    expect(await persona(page), "de retour à l'écran, elle repart").not.toBe(avant);
  });

  test("changer de slide change le thème et le sélecteur", async ({ page }) => {
    await visit(page);
    await page.getByRole("button", { name: /Persona suivant|Next persona/ }).click();
    await page.waitForTimeout(600);

    expect(await persona(page)).toBe("corneille");
    await expect(page.locator("#setting-avatar")).toHaveValue("corneille");
    await expect(page.locator(".launcher__heading")).toContainText("Corneille");

    // Agir dans le carrousel ne l'interrompt pas.
    expect(await enLecture(page)).toBe("true");
  });

  test("changer au sélecteur fait défiler et met en pause", async ({ page }) => {
    await visit(page);
    await page.selectOption("#setting-avatar", "libellule");
    await page.waitForTimeout(600);

    expect(await persona(page)).toBe("libellule");
    await expect(page.locator(".launcher__heading")).toContainText("Libellule");
    const vue = await page.evaluate(() => {
      const el = document.querySelector(".slideshow__track")!;
      return Math.round(el.scrollLeft / el.clientWidth);
    });
    expect(vue, "la piste suit le sélecteur").toBe(2);

    // Quitter le carrousel pour la barre interrompt la lecture, et elle reste
    // interrompue.
    expect(await enLecture(page)).toBe("false");
    await page.waitForTimeout(TOUR);
    expect(await persona(page)).toBe("libellule");
  });

  test("la bascule arrête et relance la lecture", async ({ page }) => {
    await visit(page);
    const bascule = page.locator(".slideshow__play");
    await bascule.click();
    expect(await enLecture(page)).toBe("false");

    const fige = await persona(page);
    await page.waitForTimeout(TOUR);
    expect(await persona(page)).toBe(fige);

    await bascule.click();
    expect(await enLecture(page)).toBe("true");
    await page.waitForTimeout(TOUR);
    expect(await persona(page)).not.toBe(fige);
  });

  test("le survol suspend le défilement, et le relâche", async ({ page }) => {
    await visit(page);
    await page.locator(".slideshow").hover();
    const fige = await persona(page);
    await page.waitForTimeout(TOUR);
    expect(await persona(page), "sous le curseur, la slide ne part pas").toBe(fige);

    // Suspension passagère : la bascule reste sur « en lecture », et le
    // défilement repart dès que la souris s'en va.
    expect(await enLecture(page)).toBe("true");
    await page.mouse.move(0, 0);
    await page.waitForTimeout(TOUR);
    expect(await persona(page)).not.toBe(fige);
  });

  test("le focus clavier suspend aussi le défilement", async ({ page }) => {
    await visit(page);
    await page.locator(".slideshow__play").focus();
    const fige = await persona(page);
    await page.waitForTimeout(TOUR);
    expect(await persona(page)).toBe(fige);
  });

  test("le panneau de conversation fige le persona", async ({ page }) => {
    // Sinon il changerait tout seul sous une conversation en cours, et la voix
    // du bot avec.
    await stubChat(page);
    await visit(page);
    await openChat(page, "Raconte-moi ton parcours");
    const fige = await persona(page);
    await page.waitForTimeout(TOUR);
    expect(await persona(page)).toBe(fige);
  });

  test("les questions suggérées suivent le persona", async ({ page }) => {
    // Chaque persona porte un domaine : ses questions le mettent en avant.
    await visit(page);
    const chips = page.locator(".launcher__suggestions .wel-chip");
    await expect(chips.first()).toContainText(/design system/i);

    await page.selectOption("#setting-avatar", "libellule");
    await page.waitForTimeout(400);
    await expect(chips.first()).toContainText(/IA|AI/);
  });
});

test.describe("Slideshow — mouvement réduit", () => {
  test("aucune lecture automatique", async ({ page }) => {
    // `prefers-reduced-motion` est lu à chaque tick : l'émuler avant la visite
    // suffit, la lecture ne démarre jamais.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visit(page);
    const avant = await persona(page);
    await page.waitForTimeout(TOUR);
    expect(await persona(page)).toBe(avant);
  });
});
