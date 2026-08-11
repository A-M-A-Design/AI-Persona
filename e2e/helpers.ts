import type { Page } from "@playwright/test";

export const PERSONAS = ["ours", "corneille", "libellule"] as const;
export const MODES = ["light", "dark"] as const;

/**
 * Réponse de chat simulée, au format de flux du SDK. Sans ce leurre, chaque
 * test consommerait le quota Mistral (tier gratuit, 429 rapide) et dépendrait
 * d'une réponse non déterministe.
 */
export async function stubChat(page: Page, answer = "Réponse simulée.") {
  await page.route("**/api/chat", async (route) => {
    const events = [
      { type: "start" },
      { type: "start-step" },
      { type: "text-start", id: "0" },
      { type: "text-delta", id: "0", delta: answer },
      { type: "text-end", id: "0" },
      { type: "finish-step" },
      { type: "finish" },
    ];
    await route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream; charset=utf-8" },
      body: events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") + "data: [DONE]\n\n",
    });
  });
}

/** Applique persona et mode avant le premier rendu, comme le script anti-flash. */
export async function visit(
  page: Page,
  { persona = "ours", mode = "light", lang = "fr" } = {},
) {
  await page.addInitScript(
    ([p, m, l]) => {
      localStorage.setItem(
        "ai-persona:settings",
        JSON.stringify({ persona: p, colorMode: m, lang: l }),
      );
    },
    [persona, mode, lang],
  );
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

/** Ouvre le panneau de conversation en envoyant une question. */
export async function openChat(page: Page, question = "Bonjour") {
  await page.locator(".launcher__row input").fill(question);
  await page.locator(".launcher__row button[type=submit]").click();
  await page.locator(".chat-modal__panel").waitFor();
}
