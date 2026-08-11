import "../styles/welds-src/template.theme.css";
import "../styles/welds-src/components.css";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Arthur Mathon — AI Persona",
  description:
    "Discutez avec la version IA d'Arthur Mathon, Design System Lead/Product/Ops.",
};

// Applique les préférences (mode, persona, langue) avant le premier paint — anti-flash.
const settingsScript = `(function(){try{var s=JSON.parse(localStorage.getItem("ai-persona:settings")||"{}");var d=document.documentElement;if(s.colorMode)d.setAttribute("data-color-mode",s.colorMode);if(s.persona)d.setAttribute("data-persona",s.persona);if(s.lang)d.setAttribute("lang",s.lang);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      data-persona="ours"
      data-color-mode="light"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* M0 : fonts du thème brandbook chargées par nom littéral.
            M3 : remplacées par les fonts persona via next/font + mappings. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Roboto:wght@400;500;700&family=Unna:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: settingsScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
