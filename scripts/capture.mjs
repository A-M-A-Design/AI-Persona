/**
 * Captures d'écran de l'app, pour comparaison avec les frames Figma.
 *
 * Usage : npm run shots            (tous les personas, mode clair, desktop)
 *         npm run shots -- --all   (3 personas × 2 modes × 3 breakpoints)
 *
 * Les images atterrissent dans e2e/__screenshots__/ (gitignoré).
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "e2e", "__screenshots__");
// localhost et non 127.0.0.1 : Next 16 renvoie 403 sur /_next/* aux autres
// origines en dev, et la page n'hydrate alors jamais.
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const VIEWPORTS = {
  desktop: { width: 1440, height: 1200 },
  tablet: { width: 1000, height: 1100 },
  mobile: { width: 375, height: 900 },
};

const all = process.argv.includes("--all");
const personas = ["ours", "corneille", "libellule"];
const modes = all ? ["light", "dark"] : ["light"];
const sizes = all ? Object.keys(VIEWPORTS) : ["desktop"];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
let count = 0;

for (const size of sizes) {
  for (const persona of personas) {
    for (const mode of modes) {
      const page = await browser.newPage({ viewport: VIEWPORTS[size] });
      await page.addInitScript(
        ([p, m]) => {
          localStorage.setItem(
            "ai-persona:settings",
            JSON.stringify({ persona: p, colorMode: m, lang: "fr" }),
          );
        },
        [persona, mode],
      );
      await page.goto(BASE);
      await page.waitForLoadState("networkidle");

      const name = `${persona}-${mode}-${size}`;
      await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
      count++;

      // Panneau de conversation, avec une réponse simulée pour ne pas
      // consommer le quota du provider.
      await page.route("**/api/chat", (route) =>
        route.fulfill({
          status: 200,
          headers: { "content-type": "text/event-stream; charset=utf-8" },
          body:
            [
              { type: "start" },
              { type: "start-step" },
              { type: "text-start", id: "0" },
              { type: "text-delta", id: "0", delta: "Voici l'emplacement de la première réponse." },
              { type: "text-end", id: "0" },
              { type: "finish-step" },
              { type: "finish" },
            ]
              .map((e) => `data: ${JSON.stringify(e)}\n\n`)
              .join("") + "data: [DONE]\n\n",
        }),
      );
      await page.locator(".launcher__row input").fill("Comment tu travailles avec les équipes ?");
      await page.locator(".launcher__row button[type=submit]").click();
      await page.locator(".chat-modal__answer").waitFor();
      // La réponse peut arriver avant la fin du fondu d'ouverture : sans cette
      // attente, la capture montre le panneau à demi transparent.
      await page
        .locator(".chat-modal__panel")
        .evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
      await page.screenshot({ path: join(outDir, `${name}-chat.png`) });
      count++;

      await page.close();
    }
  }
}

await browser.close();
console.log(`✔ ${count} captures dans e2e/__screenshots__/`);
