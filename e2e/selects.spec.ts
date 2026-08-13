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

/** Quel élément reçoit le clic en un point de la boîte, en fraction de largeur ? */
async function cibleAu(page: import("@playwright/test").Page, sel: string, fraction: number) {
  return page.evaluate(
    ([s, f]) => {
      const el = document.querySelector(s as string);
      if (!el) return "introuvable";
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(
        r.left + r.width * (f as number),
        r.top + r.height / 2,
      );
      return hit?.tagName.toLowerCase() ?? "rien";
    },
    [sel, fraction] as const,
  );
}

test.describe("Sélecteurs", () => {
  test("le chip du header ouvre sa liste sur toute sa surface", async ({ page }) => {
    await visit(page);
    // 8 % / 50 % / 94 % : le libellé, le milieu, puis le chevron.
    for (const fraction of [0.08, 0.5, 0.94]) {
      expect(await cibleAu(page, ".ama-chip--dropdown", fraction)).toBe("select");
    }
  });

  test("le champ de la barre de réglages ouvre sa liste sur toute sa surface", async ({
    page,
  }) => {
    await page.goto("/dev/kit");
    await page.waitForLoadState("networkidle");
    for (const fraction of [0.08, 0.5, 0.94]) {
      expect(await cibleAu(page, ".ama-select__control-wrapper", fraction)).toBe("select");
    }
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
