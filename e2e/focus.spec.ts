import { expect, test } from "@playwright/test";
import { visit } from "./helpers";

/**
 * L'anneau de focus, un seul et même partout.
 *
 * Signalé le 2026-08-13 : « l'état focus ne suit pas la border des éléments
 * focusables ». Deux causes distinctes, l'une de forme, l'autre d'uniformité.
 *
 * - Les **cibles de saut** (`main`, la grille d'articles) portent
 *   `tabindex="-1"` pour que le focus s'y pose. Le navigateur y dessinait alors
 *   *son* anneau : un rectangle de 1 px encadrant tout le bloc, qui ne suit
 *   aucune bordure. Elles ne sont pas des commandes — on le retire.
 * - Les anneaux étaient **écrits en dur** (`border-width-strong`, `2px`) là où
 *   l'export de tokens porte `focus.outline-width`, `-offset` et `-style`. Le
 *   champ de saisie s'en écartait même : 1 px, collé à sa bordure.
 */

/** Éléments interactifs : tous doivent porter le même anneau, issu des tokens. */
const COMMANDES = [
  ['.skip-link[href="#contenu"]', "lien d'évitement"],
  [".site-nav__toggle", "bascule de mode"],
  ["#question", "champ de question"],
  [".launcher__row button[type=submit]", "bouton d'envoi"],
  [".articles a", "card d'article"],
  [".site-footer__link", "lien du pied de page"],
] as const;

/** Conteneurs visés par un lien d'accès rapide : aucun anneau attendu. */
const CIBLES_DE_SAUT = ["main#contenu", "#articles"] as const;

async function anneau(page: import("@playwright/test").Page, sel: string) {
  return page.evaluate((s) => {
    const el = document.querySelector<HTMLElement>(s);
    if (!el) return null;
    el.focus();
    const c = getComputedStyle(el);
    return { width: c.outlineWidth, style: c.outlineStyle, offset: c.outlineOffset };
  }, sel);
}

test.describe("Anneau de focus", () => {
  for (const [sel, nom] of COMMANDES) {
    test(`${nom} : anneau issu des tokens`, async ({ page }) => {
      await visit(page);
      const a = await anneau(page, sel);
      expect(a, `${sel} introuvable`).not.toBeNull();
      // 0.125rem et 0.1875rem, résolus par le navigateur.
      expect(a!.width).toBe("2px");
      expect(a!.style).toBe("solid");
      expect(a!.offset).toBe("3px");
    });
  }

  for (const sel of CIBLES_DE_SAUT) {
    test(`${sel} : aucun anneau, ce n'est pas une commande`, async ({ page }) => {
      await visit(page);
      const a = await anneau(page, sel);
      expect(a, `${sel} introuvable`).not.toBeNull();
      expect(a!.style).toBe("none");
    });
  }

  test("plus aucune valeur d'anneau écrite en dur dans le CSS applicatif", async ({
    page,
  }) => {
    await visit(page);
    // Le CSS servi porte les tokens, pas leurs valeurs : si quelqu'un réécrit
    // un anneau à la main, la feuille le montrera.
    const dur = await page.evaluate(async () => {
      const lien = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
        .map((l) => l.href)
        .find((h) => h.includes("root-of-the-server"));
      if (!lien) return "feuille introuvable";
      const css = await (await fetch(lien)).text();
      // Un anneau de focus légitime cite le token de couleur.
      const regles = css.match(/outline:[^;]*--ama-sem-color-focus[^;]*;/g) ?? [];
      return regles.filter((r) => !r.includes("--ama-sem-sizing-focus-outline-width"));
    });
    expect(dur).toEqual([]);
  });
});
