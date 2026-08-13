import { expect, test } from "@playwright/test";
import { visit } from "./helpers";

/**
 * Les deux sélecteurs du site ne se ressemblent pas : celui du header enveloppe
 * un `<select>` transparent dans un chip, celui de la page kit le montre dans
 * son enveloppe. Dans les deux cas la règle est la même — **toute la surface
 * ouvre la liste**, chevron compris.
 *
 * Vécu le 2026-08-13 : le balisage posait un glyphe `▾` frère du `<select>`.
 * Il recevait le clic sans rien en faire, et la bande droite du champ était
 * donc inerte. Rien ne le disait : ni erreur, ni test — le sélecteur
 * fonctionnait partout ailleurs.
 */

/**
 * Balaye toute la largeur et renvoie les points qui n'atteignent pas le
 * `<select>`. Le balayage n'est pas du zèle : une première version de ce test
 * échantillonnait 8 %, 50 % et 94 %, et **encadrait la zone morte sans jamais
 * la toucher** — elle s'étendait de 64 % à 83 %, la largeur du chevron. Trois
 * points ne décrivent pas une surface.
 */
async function pointsMorts(page: import("@playwright/test").Page, sel: string) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return ["sélecteur introuvable"];
    const r = el.getBoundingClientRect();
    const morts: string[] = [];
    for (let px = 2; px < r.width - 1; px += 2) {
      const hit = document.elementFromPoint(r.left + px, r.top + r.height / 2);
      if (hit?.tagName.toLowerCase() !== "select") {
        morts.push(`${Math.round((px / r.width) * 100)}% → ${hit?.tagName.toLowerCase()}`);
      }
    }
    return morts;
  }, sel);
}

test.describe("Sélecteurs", () => {
  test("le chip du header ouvre sa liste sur toute sa surface", async ({ page }) => {
    await visit(page);
    expect(await pointsMorts(page, ".ama-chip--dropdown")).toEqual([]);
  });

  test("le champ de la barre de réglages ouvre sa liste sur toute sa surface", async ({
    page,
  }) => {
    await page.goto("/dev/kit");
    await page.waitForLoadState("networkidle");
    expect(await pointsMorts(page, ".ama-select__control-wrapper")).toEqual([]);
  });

  test("un seul chevron par sélecteur", async ({ page }) => {
    await page.goto("/dev/kit");
    await page.waitForLoadState("networkidle");
    // Le composant dessine le sien en ::after ; le balisage ne doit pas en
    // poser un second, sous peine de les superposer.
    await expect(page.locator(".ama-select__icon")).toHaveCount(0);

    // Le header en porte deux (avatar, langue) : chacun doit masquer le sien,
    // que le chevron du composant remplace.
    await visit(page);
    const glyphes = page.locator(".ama-chip--dropdown .ama-chip__icon");
    const n = await glyphes.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) await expect(glyphes.nth(i)).toBeHidden();
  });
});
