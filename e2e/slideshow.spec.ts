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

  test("le persona mémorisé est restauré sans faire défiler la piste", async ({ page }) => {
    // `useSettings` rend les défauts SSR puis lit <html> à son montage : le
    // composant rattrape alors la slide du persona mémorisé. Ce rattrapage doit
    // être instantané. Animé, il donnait à voir un défilement de l'ours vers la
    // libellule au chargement, comme si le carrousel démarrait tout seul.
    await page.addInitScript(() => {
      (window as unknown as { __positions: number[] }).__positions = [];
      const releve = () => {
        const piste = document.querySelector(".slideshow__track");
        if (piste) (window as unknown as { __positions: number[] }).__positions.push(piste.scrollLeft);
        requestAnimationFrame(releve);
      };
      requestAnimationFrame(releve);
    });
    await visit(page, { persona: "libellule" });

    const largeur = await page.locator(".slideshow__track").evaluate((el) => el.clientWidth);
    const positions = await page.evaluate(
      () => (window as unknown as { __positions: number[] }).__positions,
    );

    // Une animation laisse forcément des positions intermédiaires ; un saut, non.
    const intermediaires = positions.filter((x) => x > 4 && x < 2 * largeur - 4);
    expect(intermediaires).toHaveLength(0);
    expect(await persona(page)).toBe("libellule");
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

    // Le curseur est reste sur la bascule, donc sur le carrousel : la
    // suspension au survol tient tant qu'on ne s'en eloigne pas. On s'ecarte,
    // comme le ferait un vrai clic.
    await page.mouse.move(0, 0);
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

  test("les flèches changent de slide quand le focus est dans le carrousel", async ({ page }) => {
    // Troisième échappatoire de WCAG 2.1.4 : le raccourci n'existe que là où le
    // focus se trouve, ce qui dispense d'un réglage de désactivation.
    await visit(page);
    await page.locator(".slideshow__play").focus();

    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    expect(await persona(page)).toBe("corneille");

    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(500);
    expect(await persona(page)).toBe("ours");

    await expect(
      page.getByRole("button", { name: /Persona suivant|Next persona/ }),
    ).toHaveAttribute("aria-keyshortcuts", "ArrowRight");
  });

  test("les flèches restent au champ de saisie", async ({ page }) => {
    // Le champ vit dans le carrousel : sans cette réserve, on ne pourrait plus
    // y déplacer le curseur.
    await visit(page);
    await page.locator(".launcher__row input").fill("bonjour");
    await page.locator(".launcher__row input").focus();

    const avant = await persona(page);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(400);
    expect(await persona(page)).toBe(avant);
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
    const chips = page.locator(".launcher__suggestions .ama-chip");
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


/**
 * Lecture automatique et mode de navigation.
 *
 * Demandé après une passe au lecteur d'écran : « mettre en pause le carrousel
 * quand un lecteur d'écran est actif ». **Aucune API ne le permet** — rien
 * n'expose la présence d'une technologie d'assistance.
 *
 * Ce qu'on observe, c'est la *façon de naviguer* (`components/NavMode.tsx`) :
 * un utilisateur de lecteur d'écran navigue au clavier et ne produit aucun
 * événement pointeur, il reste donc en mode clavier toute sa visite. La
 * réciproque est fausse — mais, à la différence du verrou qui précédait, le
 * mode est **réversible** : la souris rend l'animation.
 */
test.describe("Slideshow — mode de navigation", () => {
  test("la tabulation fige le carrousel", async ({ page }) => {
    await visit(page);
    await expect(page.locator(".slideshow__play")).toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("Tab");
    await expect(page.locator(".slideshow__play")).toHaveAttribute("aria-pressed", "false");

    const avant = await persona(page);
    await page.waitForTimeout(TOUR);
    expect(await persona(page)).toBe(avant);
  });

  test("la souris le relance — le mode n'est pas une porte à sens unique", async ({
    page,
  }) => {
    await visit(page);
    await page.keyboard.press("Tab");
    await expect(page.locator(".slideshow__play")).toHaveAttribute("aria-pressed", "false");

    // Un clic de souris quelque part de neutre suffit à redire « pointeur ».
    await page.mouse.click(5, 5);
    await expect(page.locator(".slideshow__play")).toHaveAttribute("aria-pressed", "true");
    await page.waitForTimeout(TOUR);
    expect(await persona(page)).toBe("corneille");
  });

  test("le mode est mémorisé, et relu à l'ouverture", async ({ page }) => {
    await visit(page);
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("ai-persona:settings") ?? "{}").navMode,
      ),
    ).toBe("keyboard");

    // Sans `visit` : son script d'initialisation réécrit l'objet de réglages
    // entier à chaque navigation, et effacerait justement ce qu'on vérifie.
    await page.addInitScript(() => {
      localStorage.setItem(
        "ai-persona:settings",
        JSON.stringify({ persona: "ours", colorMode: "light", lang: "fr", navMode: "keyboard" }),
      );
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".slideshow__play")).toHaveAttribute("aria-pressed", "false");
  });

  test("le bouton lecture prime sur le mode : il contrôle vraiment", async ({ page }) => {
    await visit(page);
    await page.keyboard.press("Tab");
    await expect(page.locator(".slideshow__play")).toHaveAttribute("aria-pressed", "false");

    // Un clavier qui demande la lecture doit l'obtenir, sans quoi le bouton
    // serait un contrôle sans effet pour qui navigue au clavier.
    await page.locator(".slideshow__play").press("Enter");
    await expect(page.locator(".slideshow__play")).toHaveAttribute("aria-pressed", "true");
  });

  test("écrire dans le champ ne fige rien", async ({ page }) => {
    await visit(page);
    // Déplacer le curseur dans un champ, c'est éditer, pas naviguer — et le
    // lanceur de conversation vit dans ce carrousel.
    await page.locator("#question").focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("End");
    await expect(page.locator(".slideshow__play")).toHaveAttribute("aria-pressed", "true");
  });
});
