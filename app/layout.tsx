import "../styles/generated/ours.css";
import "../styles/generated/corneille.css";
import "../styles/generated/libellule.css";
// Composants du site, écrits ici et versionnés : ils ne dépendent plus de
// l'extraction locale du WDS Accor, seulement du contrat `--ama-*` que les
// thèmes ci-dessus définissent. C'est ce qui rend le dépôt déployable seul.
import "../styles/components/index.css";
import "../styles/persona-extras.css";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import NavMode from "../components/NavMode";
import Shortcuts from "../components/Shortcuts";
import {
  Cormorant_Garamond,
  Fraunces,
  Nunito_Sans,
  Press_Start_2P,
  VT323,
  Work_Sans,
} from "next/font/google";

// Fonts par persona, exposées en variables CSS consommées par les thèmes générés.
const oursDisplay = Fraunces({ subsets: ["latin"], variable: "--font-ours-display", display: "swap" });
const oursBody = Nunito_Sans({ subsets: ["latin"], variable: "--font-ours-body", display: "swap" });
const corneilleDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-corneille-display",
  display: "swap",
});
const corneilleBody = Work_Sans({ subsets: ["latin"], variable: "--font-corneille-body", display: "swap" });
const libelluleDisplay = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-libellule-display",
  display: "swap",
});
const libelluleBody = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-libellule-body",
  display: "swap",
});

const fontVariables = [
  oursDisplay,
  oursBody,
  corneilleDisplay,
  corneilleBody,
  libelluleDisplay,
  libelluleBody,
]
  .map((f) => f.variable)
  .join(" ");

export const metadata: Metadata = {
  title: "Arthur Mathon — AI Persona",
  description:
    "Discutez avec la version IA d'Arthur Mathon, Design System Lead/Product/Ops.",
};

// Applique les préférences (mode, persona, langue) avant le premier paint — anti-flash.
const settingsScript = `(function(){try{var s=JSON.parse(localStorage.getItem("ai-persona:settings")||"{}");var d=document.documentElement;if(s.colorMode)d.setAttribute("data-color-mode",s.colorMode);if(s.persona)d.setAttribute("data-persona",s.persona);if(s.lang)d.setAttribute("lang",s.lang);if(s.shortcuts===false)d.setAttribute("data-shortcuts","off");if(s.navMode)d.setAttribute("data-nav-mode",s.navMode);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      data-persona="ours"
      data-color-mode="light"
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: settingsScript }} />
      </head>
      {/* L'accès rapide n'est plus rendu ici mais par chaque page : ses
          destinations dépendent de la page, et il doit rester le tout premier
          contenu annoncé. `Shortcuts` passe donc après — son bouton de
          découverte est une commodité, pas un point d'entrée. */}
      <body>
        {children}
        {/* Ne rend rien : il observe la façon de naviguer et la pose en
            `data-nav-mode`. Le carrousel s'en sert pour ne pas tourner sous
            une lecture au clavier. */}
        <NavMode />
        <Shortcuts />
      </body>
    </html>
  );
}
