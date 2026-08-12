import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openChat, stubChat, visit } from "./helpers";

// Balayage axe-core sur les trois écrans du site, aux quatre largeurs — dont
// 320 px, plancher du critère de redistribution (WCAG 1.4.10).
//
// Le balayage automatique ne prouve pas l'accessibilité : il attrape les
// manquements mécaniques (rôle, nom, contraste, structure). Ce qu'il ne voit
// pas — l'ordre et la pertinence de ce qui est annoncé — est couvert par les
// tests nominatifs du bas de fichier et par la passe manuelle décrite dans
// docs/accessibilite.md.

// `best-practice` en plus des normes : c'est la seule famille qui porte
// `heading-order`, et c'est elle qui a signalé le saut h1 → h3 de l'accueil.
// Les normes WCAG seules ne relevaient rien sur ce site.
const NORMES = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

async function analyse(page: Page) {
  return new AxeBuilder({ page }).withTags(NORMES).analyze();
}

/** Rend les violations lisibles dans la sortie de test. */
function resume(violations: Awaited<ReturnType<typeof analyse>>["violations"]) {
  return violations
    .map((v) => `${v.id} (${v.impact}) — ${v.help}\n    ${v.nodes.map((n) => n.target.join(" ")).join("\n    ")}`)
    .join("\n  ");
}

const ARTICLE = "/articles/roi-design-system";

test.describe("Balayage axe", () => {
  test("accueil", async ({ page }) => {
    await visit(page);
    const { violations } = await analyse(page);
    expect(resume(violations)).toBe("");
  });

  test("accueil en mode sombre", async ({ page }) => {
    // Le mode sombre a ses propres paires de couleurs : le balayage clair ne
    // dit rien de lui.
    await visit(page, { mode: "dark" });
    const { violations } = await analyse(page);
    expect(resume(violations)).toBe("");
  });

  test("page article", async ({ page }) => {
    await page.goto(ARTICLE);
    await page.waitForLoadState("networkidle");
    const { violations } = await analyse(page);
    expect(resume(violations)).toBe("");
  });

  test("panneau de conversation ouvert", async ({ page }) => {
    await stubChat(page);
    await visit(page);
    await openChat(page, "Raconte-moi ton parcours");
    await expect(page.locator(".chat-modal__answer")).toContainText("Réponse simulée");

    // Le panneau entre en fondu : balayé pendant l'animation, il est encore
    // partiellement transparent et axe calcule les contrastes sur des couleurs
    // composées avec ce qui se trouve derrière — d'où des échecs qui ne disent
    // rien de la page posée. On attend la fin des animations en cours plutôt
    // qu'une durée arbitraire.
    await page
      .locator(".chat-modal__panel")
      .evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));

    const { violations } = await analyse(page);
    expect(resume(violations)).toBe("");
  });
});

test.describe("Nom accessible", () => {
  test("les cards annoncent l'action puis le titre", async ({ page }) => {
    // Le constat d'Arthur : le lecteur d'écran doit dire « Lire l'article,
    // Comment remettre en mouvement une entreprise traumatisée ? », et non la
    // concaténation de tout le contenu de la card, surtitre compris.
    await visit(page);
    const card = page.locator(".article-card").first();
    const nom = await card.evaluate((el) => {
      const ids = el.getAttribute("aria-labelledby")!.split(" ");
      return ids.map((id) => document.getElementById(id)!.textContent!.trim()).join(", ");
    });
    expect(nom).toMatch(/^Lire l'article, .+\?$/);

    // Le surtitre ne fait pas partie du nom : il reste lisible en exploration.
    const kicker = await page.locator(".article-card__kicker").first().textContent();
    expect(nom).not.toContain(kicker!.trim());
  });

  test("le champ de saisie a un libellé distinct de son indice", async ({ page }) => {
    await visit(page);
    const champ = page.locator(".launcher__row input");
    const { nom, placeholder } = await champ.evaluate((el: HTMLInputElement) => ({
      nom: document.querySelector<HTMLLabelElement>(`label[for="${el.id}"]`)?.textContent?.trim(),
      placeholder: el.placeholder,
    }));
    expect(nom).toBeTruthy();
    expect(nom).not.toBe(placeholder);
    // Et plus d'aria-label qui écraserait le <label>.
    await expect(champ).not.toHaveAttribute("aria-label", /./);
  });

  test("le groupe de questions suggérées porte un rôle et un nom", async ({ page }) => {
    // `aria-label` sur un <div> sans rôle est ignoré par ARIA.
    await visit(page);
    const groupe = page.getByRole("group", { name: /Questions suggérées|Suggested questions/ });
    await expect(groupe).toBeVisible();
  });
});

test.describe("Clavier", () => {
  test("le lien d'évitement mène au contenu", async ({ page }) => {
    await visit(page);
    await page.keyboard.press("Tab");
    const lien = page.locator(".skip-link");
    await expect(lien).toBeFocused();
    // Visible une fois atteint, et non simplement présent hors écran. Le lien
    // descend par une transition : on attend qu'elle se pose.
    await expect
      .poll(async () => (await lien.boundingBox())?.y ?? -1)
      .toBeGreaterThanOrEqual(0);

    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toHaveAttribute("id", "contenu");
    expect(page.url()).toContain("#contenu");
  });

  test("tout arrêt de tabulation a un nom et un anneau visible", async ({ page }) => {
    // Relevé du parcours réel plutôt qu'une liste de sélecteurs : c'est ainsi
    // qu'on attrape un élément rendu focalisable sans avoir été nommé — la
    // piste du slideshow l'a été.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visit(page);

    const anomalies: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const r = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const etiquette = el.id
          ? document.querySelector(`label[for="${el.id}"]`)?.textContent
          : null;
        return {
          repere: el.tagName.toLowerCase() + "." + (el.className || "").toString().split(" ")[0],
          nomme: Boolean(el.getAttribute("aria-label") || etiquette || el.textContent?.trim()),
          anneau: cs.outlineStyle !== "none" && Number.parseFloat(cs.outlineWidth) > 0,
        };
      });
      if (!r) break;
      if (!r.nomme) anomalies.push(`${r.repere} : sans nom accessible`);
      if (!r.anneau) anomalies.push(`${r.repere} : sans anneau de focus`);
    }
    expect(anomalies.join("\n")).toBe("");
  });

  test("les chips de réglage montrent leur focus", async ({ page }) => {
    // Le <select> est en opacity 0 : sans style dédié, l'anneau de focus du
    // navigateur est invisible et le clavier navigue à l'aveugle.
    await visit(page);
    await page.locator("#setting-avatar").focus();
    const outline = await page
      .locator(".site-nav__chip")
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { width: cs.outlineWidth, style: cs.outlineStyle };
      });
    expect(outline.style).not.toBe("none");
    expect(Number.parseFloat(outline.width)).toBeGreaterThan(0);
  });

  test("le bouton d'envoi reste atteignable au clavier quand il est inactif", async ({ page }) => {
    // `disabled` le sortait de l'ordre de tabulation : le lecteur d'écran ne
    // le rencontrait jamais et rien n'expliquait son absence.
    await visit(page);
    const bouton = page.locator(".launcher__row button[type=submit]");
    await expect(bouton).toHaveAttribute("aria-disabled", "true");
    await bouton.focus();
    await expect(bouton).toBeFocused();
  });
});

test.describe("Annonce de la réponse", () => {
  test.beforeEach(async ({ page }) => {
    await stubChat(page);
  });

  test("une région de statut annonce la réponse une seule fois", async ({ page }) => {
    // Le fil ne doit plus être une région live : à chaque token, le paragraphe
    // entier était ré-annoncé.
    await visit(page);
    await openChat(page, "Raconte-moi ton parcours");
    await expect(page.locator(".chat-modal__answer")).toContainText("Réponse simulée");

    await expect(page.locator(".chat-modal__body")).not.toHaveAttribute("aria-live", /./);

    // Le slideshow porte lui aussi une région de statut, pour annoncer le
    // persona actif : on vise celle du panneau.
    const statut = page.locator(".chat-modal [role=status]");
    await expect(statut).toHaveCount(1);
    await expect(statut).toContainText("Réponse simulée");
  });

  test("l'arrière-plan est neutralisé pendant la conversation", async ({ page }) => {
    await visit(page);
    await openChat(page);
    await expect(page.locator("main")).toHaveAttribute("inert", "");
    await expect(page.locator(".site-nav")).toHaveAttribute("inert", "");

    await page.keyboard.press("Escape");
    await expect(page.locator(".chat-modal__panel")).toHaveCount(0);
    await expect(page.locator("main")).not.toHaveAttribute("inert", /.*/);
  });
});
