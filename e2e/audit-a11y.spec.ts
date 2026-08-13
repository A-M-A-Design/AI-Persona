import { expect, test, type Page } from "@playwright/test";
import { openChat, stubChat, visit } from "./helpers";

/**
 * Audit d'accessibilité systématique — les classes de défauts trouvées à
 * l'usage, pas celles qu'un balayage générique attrape.
 *
 * Chaque contrôle vient d'un défaut **réel**, relevé au lecteur d'écran ou à la
 * main pendant la session du 2026-08-13, et qu'aucun outil automatique n'avait
 * signalé : axe passait au vert sur tous. Le balayage axe reste dans
 * `a11y.spec.ts` ; ce fichier-ci couvre ce qu'il ne voit pas.
 *
 * Les tolérances sont explicites et motivées. Une tolérance sans raison écrite
 * est une régression déguisée.
 */

const ARTICLE = "/articles/roi-design-system";

const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';

/** Contrôles réellement présents à l'écran, hors zones neutralisées. */
async function controles(page: Page) {
  return page.evaluate((sel) => {
    return [...document.querySelectorAll<HTMLElement>(sel)]
      .filter((e) => e.offsetParent !== null || getComputedStyle(e).position === "fixed")
      .filter((e) => !e.closest("[inert]"))
      .map((e) => {
        const r = e.getBoundingClientRect();
        return {
          repere: `${e.tagName.toLowerCase()}${e.id ? "#" + e.id : ""}${e.className ? "." + String(e.className).split(" ")[0] : ""}`,
          w: Math.round(r.width),
          h: Math.round(r.height),
          desactive:
            e.getAttribute("aria-disabled") === "true" || (e as HTMLInputElement).disabled,
        };
      });
  }, FOCUSABLE);
}

test.describe("Audit — annonces en double", () => {
  /*
    Deux défauts de cette famille ont été entendus, aucun vu : un `<label>`
    masqué visuellement lu **puis** re-annoncé comme nom du champ, et un
    `<title>` reprenant mot pour mot le `h1`. Le point commun : le même texte
    existe deux fois dans l'arbre, à deux titres différents.
  */
  test("le titre du document ne reprend jamais le titre de niveau 1", async ({ page }) => {
    for (const url of ["/", ARTICLE]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const r = await page.evaluate(() => ({
        titre: document.title.trim(),
        h1: document.querySelector("h1")?.textContent?.trim() ?? "",
      }));
      expect(r.titre, url).not.toBe(r.h1);
    }
  });

  test("le nom d'un contrôle n'est pas répété en texte à côté de lui", async ({ page }) => {
    for (const url of ["/", ARTICLE]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const doublons = await page.evaluate((sel) => {
        const out: string[] = [];
        document.querySelectorAll<HTMLElement>(sel).forEach((e) => {
          const nom = (e.getAttribute("aria-label") ?? "").trim();
          if (!nom) return;
          const parent = e.closest("div,p,span,section,form") ?? e.parentElement;
          [...(parent?.children ?? [])]
            .filter((c) => c !== e && !c.contains(e))
            .forEach((v) => {
              if (
                (v.textContent ?? "").trim() === nom &&
                v.getAttribute("aria-hidden") !== "true"
              ) {
                out.push(`${e.tagName.toLowerCase()} « ${nom} »`);
              }
            });
        });
        return out;
      }, FOCUSABLE);
      expect(doublons, url).toEqual([]);
    }
  });

  test("une région live ne mêle pas une forme visuelle et une forme parlée", async ({
    page,
  }) => {
    /*
      Le compteur du carousel porte les deux — « 1 / 2 » à l'écran, « Page 1
      sur 2 » à l'oreille. C'est correct **parce que** la forme visuelle est en
      `aria-hidden` : sans cela, les deux se suivraient dans l'annonce.
    */
    await page.goto(ARTICLE);
    await page.waitForLoadState("networkidle");
    const melanges = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll('[aria-live],[role="status"],[role="alert"]').forEach((e) => {
        const cache = e.querySelector(".a11y-hidden");
        if (!cache) return;
        const visibleAnnonce = [...e.childNodes].some(
          (n) =>
            (n.nodeType === 3 && (n.textContent ?? "").trim()) ||
            (n.nodeType === 1 &&
              (n as Element).className !== "a11y-hidden" &&
              (n as Element).getAttribute("aria-hidden") !== "true"),
        );
        if (visibleAnnonce) out.push(e.className);
      });
      return out;
    });
    expect(melanges).toEqual([]);
  });

  test("aucun attribut lang ne répète la langue du document", async ({ page }) => {
    for (const url of ["/", ARTICLE]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const redondants = await page.evaluate(() => {
        const doc = document.documentElement.lang;
        return [...document.querySelectorAll("[lang]")]
          .filter((e) => e !== document.documentElement && e.getAttribute("lang") === doc)
          .map((e) => e.tagName.toLowerCase());
      });
      expect(redondants, url).toEqual([]);
    }
  });
});

test.describe("Audit — pointeur et cibles", () => {
  /*
    La leçon du chevron : `mask-image` crée un contexte d'empilement, tout comme
    `transform`. Un pseudo-élément décoratif passe alors **au-dessus** du
    contrôle qu'il décore et lui vole le clic. Invisible à l'œil, invisible aux
    tests qui échantillonnent — la zone morte du chip faisait 20 % de sa largeur
    et trois points de mesure l'encadraient sans la toucher.
  */
  test("aucun contrôle n'a de zone morte", async ({ page }) => {
    await visit(page);
    const morts = await page.evaluate((sel) => {
      const out: string[] = [];
      document.querySelectorAll<HTMLElement>(sel).forEach((e) => {
        if (e.closest("[inert]")) return;
        // Un contrôle inactif ne reçoit volontairement pas le pointeur.
        if (e.getAttribute("aria-disabled") === "true" || (e as HTMLInputElement).disabled) return;
        // La partie **visible** seule : dans un défileur, une chip large déborde
        // largement sa fenêtre, et ce qui est rogné n'est ni vu ni cliquable.
        // Mesurer sa boîte entière signalerait une zone morte imaginaire.
        let r = e.getBoundingClientRect();
        let p: HTMLElement | null = e.parentElement;
        while (p && p !== document.body) {
          const c = getComputedStyle(p);
          if (/(auto|scroll|hidden)/.test(c.overflowX + c.overflowY)) {
            const pr = p.getBoundingClientRect();
            const left = Math.max(r.left, pr.left);
            const right = Math.min(r.right, pr.right);
            const top = Math.max(r.top, pr.top);
            const bottom = Math.min(r.bottom, pr.bottom);
            // Entièrement rogné : ni vu ni cliquable, rien à mesurer. Sans
            // cette sortie, une largeur négative donnerait un DOMRect
            // normalisé ailleurs à l'écran, et des zones mortes imaginaires.
            if (right <= left || bottom <= top) return;
            r = new DOMRect(left, top, right - left, bottom - top);
          }
          p = p.parentElement;
        }
        if (r.width < 8 || r.height < 8) return;
        for (let f = 0.1; f <= 0.9; f += 0.1) {
          const hit = document.elementFromPoint(r.left + r.width * f, r.top + r.height / 2);
          if (hit && hit !== e && !e.contains(hit) && !hit.contains(e)) {
            out.push(
              `${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]} à ${Math.round(f * 100)}%`,
            );
            return;
          }
        }
      });
      return out;
    }, FOCUSABLE);
    expect(morts).toEqual([]);
  });

  test("toute cible fait au moins 24 × 24 px — WCAG 2.5.8", async ({ page }) => {
    await stubChat(page);
    await visit(page);
    const petits = (await controles(page)).filter(
      (c) => c.w > 0 && c.h > 0 && (c.w < 24 || c.h < 24),
    );
    expect(petits.map((c) => `${c.repere} ${c.w}×${c.h}`)).toEqual([]);

    // Le panneau de conversation compte aussi : son bouton de fermeture y
    // était comprimé à 22 px par le conteneur flex du bandeau.
    await openChat(page);
    await page.locator(".chat-modal__panel").waitFor();
    const petitsPanneau = (await controles(page)).filter(
      (c) => c.w > 0 && c.h > 0 && (c.w < 24 || c.h < 24),
    );
    expect(petitsPanneau.map((c) => `${c.repere} ${c.w}×${c.h}`)).toEqual([]);
  });
});

test.describe("Audit — structure", () => {
  test("un seul titre de niveau 1 exposé par page", async ({ page }) => {
    for (const url of ["/", ARTICLE]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      // Les slides inactives du carrousel sont `inert` : leurs trois `h1`
      // identiques ne sont pas exposés, et c'est ce qui rend le compte juste.
      const n = await page.evaluate(
        () =>
          [...document.querySelectorAll("h1")].filter(
            (h) => !h.closest("[inert],[aria-hidden='true']"),
          ).length,
      );
      expect(n, url).toBe(1);
    }
  });

  test("aucun élément focalisable n'est caché par aria-hidden", async ({ page }) => {
    for (const url of ["/", ARTICLE]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const pieges = await page.evaluate((sel) => {
        const out: string[] = [];
        document.querySelectorAll('[aria-hidden="true"]').forEach((e) => {
          const dedans = [...e.querySelectorAll<HTMLElement>(sel)].filter(
            (f) => !f.closest("[inert]"),
          );
          if (e.matches(sel) || dedans.length) out.push(e.className || e.tagName);
        });
        return out;
      }, FOCUSABLE);
      expect(pieges, url).toEqual([]);
    }
  });

  test("toute cible d'ancre dégage la barre collante", async ({ page }) => {
    /*
      La barre est `sticky` : sans `scroll-margin-top`, une ancre pose sa cible
      à `top: 0`, donc dessous — invisible, pendant que l'écran montre la suite
      de la page.
    */
    await visit(page);
    const sansMarge = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        const id = a.getAttribute("href")!.slice(1);
        const cible = document.getElementById(id);
        if (!cible) {
          out.push(`#${id} : cible absente`);
          return;
        }
        const sm = Number.parseFloat(getComputedStyle(cible).scrollMarginTop);
        const barre = document.querySelector(".site-nav__inner")?.getBoundingClientRect().height ?? 0;
        if (!(sm >= barre)) out.push(`#${id} : scroll-margin-top ${sm}px < barre ${barre}px`);
      });
      return out;
    });
    expect(sansMarge).toEqual([]);
  });
});

test.describe("Audit — contraste forcé", () => {
  /*
    Windows en contraste élevé (`forced-colors: active`) remplace d'autorité les
    couleurs par sa propre palette : nos tokens ne s'appliquent plus, et tout ce
    qui ne reposait **que** sur une couleur disparaît. Le site n'en tenait aucun
    compte jusqu'au 2026-08-13.
  */
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
  });

  test("les chips gardent un contour", async ({ page }) => {
    await visit(page);
    // Sans bordure au repos, une chip devient un mot posé sur la page : plus
    // rien ne dit que c'est un bouton.
    const bord = await page.evaluate(() => {
      const c = document.querySelector(".launcher__suggestions .ama-chip");
      if (!c) return null;
      const s = getComputedStyle(c);
      return { style: s.borderTopStyle, largeur: Number.parseFloat(s.borderTopWidth) };
    });
    expect(bord?.style).not.toBe("none");
    expect(bord?.largeur ?? 0).toBeGreaterThan(0);
  });

  test("l'anneau de focus quitte la couleur du thème pour celle du système", async ({
    page,
  }) => {
    await visit(page);
    await page.keyboard.press("Tab");
    const couleur = await page.evaluate(() => {
      const el = document.querySelector(".skip-link:focus");
      return el ? getComputedStyle(el).outlineColor : null;
    });
    // La teinte du persona `ours` : elle ne doit plus être servie ici.
    expect(couleur).not.toBe("rgb(180, 91, 35)");
    expect(couleur).not.toBe("");
  });

  test("les conteneurs dessinés par un aplat gardent un contour", async ({ page }) => {
    await visit(page);
    const carte = await page.evaluate(() => {
      const c = document.querySelector(".article-card");
      if (!c) return null;
      const s = getComputedStyle(c);
      return { style: s.borderTopStyle, largeur: Number.parseFloat(s.borderTopWidth) };
    });
    expect(carte?.style).not.toBe("none");
    expect(carte?.largeur ?? 0).toBeGreaterThan(0);
  });
});

test.describe("Audit — contraste rendu", () => {
  /*
    Le script `a11y:contrast` compare des **paires de tokens**. Il ne voit donc
    rien de ce qui n'en est pas un : l'indice de saisie gardait la couleur par
    défaut du navigateur — `rgb(117, 117, 117)` — soit **3,86:1** sur le panneau
    du lanceur, sous le seuil AA, sur le champ le plus visible du site. Ni le
    script ni axe ne le signalaient. Il a fallu mesurer ce que le navigateur
    **rend**, et non ce que la feuille déclare.

    Ce test le fait sur les trois personas et les deux modes. Le panneau du
    lanceur force le mode sombre — il est posé sur l'image — donc le champ du
    héro est dans ce cas **quel que soit le réglage du site**.
  */
  const PERSONAS = ["ours", "corneille", "libellule"] as const;
  const MODES = ["light", "dark"] as const;

  for (const persona of PERSONAS) {
    for (const mode of MODES) {
      test(`champ du héro — ${persona} / ${mode}`, async ({ page }) => {
        await visit(page, { persona, mode });
        const r = await page.evaluate(() => {
          const el = document.querySelector<HTMLElement>("#question");
          if (!el) return null;
          const cs = getComputedStyle(el);
          const p = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number).slice(0, 3);
          const bg = p(cs.backgroundColor);
          const lin = (v: number) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          };
          const lum = (c: number[]) =>
            0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
          const ratio = (a: number[], b: number[]) => {
            const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x);
            return (h + 0.05) / (l + 0.05);
          };
          return {
            indice: ratio(p(getComputedStyle(el, "::placeholder").color), bg),
            saisi: ratio(p(cs.color), bg),
          };
        });
        expect(r, "#question introuvable").not.toBeNull();
        // AA pour du texte courant de 16 px, qui est la taille du champ.
        expect(r!.indice, "indice de saisie").toBeGreaterThanOrEqual(4.5);
        expect(r!.saisi, "texte saisi").toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
