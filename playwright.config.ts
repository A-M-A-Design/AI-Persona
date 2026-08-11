import { defineConfig, devices } from "@playwright/test";

// Les trois largeurs sont celles dessinées dans la maquette Figma. Elles
// tombent dans trois des quatre breakpoints du thème WDS (1280 / 1024 / 768),
// donc la typographie change bien d'échelle entre les projets.
const VIEWPORTS = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 1000, height: 900 },
  mobile: { width: 375, height: 800 },
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  use: {
    // localhost, pas 127.0.0.1 : Next 16 restreint les origines autorisées en
    // développement et renvoie 403 sur /_next/* pour les autres. Les chunks ne
    // se chargent alors pas, la page n'hydrate jamais, et tout paraît inerte.
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: Object.entries(VIEWPORTS).map(([name, viewport]) => ({
    name,
    use: { ...devices["Desktop Chrome"], viewport },
  })),
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    // Réutilise le serveur déjà lancé pendant le développement.
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
