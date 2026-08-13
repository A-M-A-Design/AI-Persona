import { expect, test } from "@playwright/test";
import { visit } from "./helpers";

/**
 * Limite de débit de la route de chat.
 *
 * `/api/chat` appelle un modèle payant avec **notre** clé : sans limite, un
 * script consomme le quota — ou la facture — en quelques minutes. C'est le seul
 * poste du MVP qui protège de l'extérieur.
 *
 * Ces tests couvrent ce que le visiteur voit ; le comportement de la route
 * elle-même se vérifie en la sollicitant directement (cf. README).
 */

/** Fait répondre 429 à la route, comme le ferait la vraie limite. */
async function limiteAtteinte(
  page: import("@playwright/test").Page,
  fenetre: "minute" | "jour" = "minute",
) {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 429,
      headers: { "content-type": "application/json", "retry-after": "42" },
      body: JSON.stringify({ error: "rate_limited", fenetre, retryAfter: 42 }),
    }),
  );
}

test.describe("Limite de débit", () => {
  test("le visiteur limité lit un message distinct, pas une erreur générique", async ({
    page,
  }) => {
    await limiteAtteinte(page);
    await visit(page);
    await page.locator(".launcher__row input").fill("Bonjour");
    await page.locator(".launcher__row button[type=submit]").click();

    const alerte = page.locator(".chat-modal__panel [role=alert]");
    await expect(alerte).toBeVisible();
    /*
      Le message générique ferait croire à une panne, et le visiteur
      réessaierait aussitôt — ce que la limite cherche précisément à éviter.
    */
    await expect(alerte).toContainText(/Patientez une minute|wait a minute/i);
    await expect(alerte).not.toContainText(/coincé|went wrong/i);
  });

  test("une vraie panne garde le message générique", async ({ page }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "boom" }),
      }),
    );
    await visit(page);
    await page.locator(".launcher__row input").fill("Bonjour");
    await page.locator(".launcher__row button[type=submit]").click();

    const alerte = page.locator(".chat-modal__panel [role=alert]");
    await expect(alerte).toBeVisible();
    await expect(alerte).toContainText(/coincé|went wrong/i);
  });


  test("la limite du jour invite à poursuivre ailleurs, dans la voix du persona", async ({
    page,
  }) => {
    await limiteAtteinte(page, "jour");
    await visit(page);
    await page.locator(".launcher__row input").fill("Bonjour");
    await page.locator(".launcher__row button[type=submit]").click();

    const alerte = page.locator(".chat-modal__panel [role=alert]");
    await expect(alerte).toContainText(/limite de questions|question limit/i);
    /*
      L'invitation vient de `footerHeading` du persona actif — « On boit un
      café ? » pour l'Ours — et non d'un texte écrit une seconde fois, qui
      divergerait du pied de page.
    */
    await expect(alerte).toContainText(/café|coffee/i);

    // Deux vraies sorties, atteignables au clavier : c'est tout ce qui reste
    // au visiteur à ce moment-là.
    await expect(alerte.getByRole("link", { name: /LinkedIn/i })).toBeVisible();
    await expect(alerte.getByRole("link", { name: /E-mail|Email/i })).toHaveAttribute(
      "href",
      /^mailto:/,
    );
  });
});
