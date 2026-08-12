import { defineConfig, devices } from "@playwright/test";

// Les trois largeurs sont celles dessinées dans la maquette Figma. Elles
// tombent dans trois des quatre breakpoints du thème WDS (1280 / 1024 / 768),
// donc la typographie change bien d'échelle entre les projets.
const VIEWPORTS = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 1000, height: 900 },
  mobile: { width: 375, height: 800 },
  // 320 px : la largeur plancher du critère de redistribution (WCAG 1.4.10),
  // sous la plus petite frame de la maquette. Seuls les tests d'accessibilité
  // y tournent — les autres décrivent la maquette, qui s'arrête à 375.
  etroit: { width: 320, height: 800 },
};

// Le port est réglable : la v2 se développe dans un worktree, sur 3001, pour
// tourner en parallèle de la v1 restée sur 3000 — Next refuse deux serveurs de
// développement dans le même dossier.
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3000);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  use: {
    // localhost, pas 127.0.0.1 : Next 16 restreint les origines autorisées en
    // développement et renvoie 403 sur /_next/* pour les autres. Les chunks ne
    // se chargent alors pas, la page n'hydrate jamais, et tout paraît inerte.
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: Object.entries(VIEWPORTS).map(([name, viewport]) => ({
    name,
    use: { ...devices["Desktop Chrome"], viewport },
    // Les autres suites décrivent la maquette et affirment ses dimensions :
    // les rejouer à 320 px n'aurait aucun sens. Seule l'accessibilité y tourne.
    ...(name === "etroit" ? { testMatch: /a11y\.spec\.ts/ } : {}),
  })),
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    // Réutilise le serveur déjà lancé pendant le développement.
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
