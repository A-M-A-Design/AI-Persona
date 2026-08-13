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
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AUTEUR, SITE_NAME, SITE_URL } from "../lib/site";
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
  /*
    Gabarit plutôt qu'un titre par page. Une page article portait pour titre de
    document le **texte exact de son `h1`** : le lecteur d'écran annonce le nom
    de la page à l'ouverture, puis le titre de niveau 1 dès qu'on lit — soit la
    même phrase deux fois de suite. Signalé sur VoiceOver le 2026-08-13.

    Le suffixe dit aussi de qui est le site, ce qu'un titre nu ne disait pas :
    utile dans un onglet, un favori ou un partage.
  */
  title: {
    default: SITE_NAME,
    template: "%s — Arthur Mathon",
  },
  description:
    "Discutez avec la version IA d'Arthur Mathon, Design System Lead/Product/Ops.",

  /*
    Sans `metadataBase`, toute URL relative de partage reste relative — et aucun
    réseau social ne va chercher une image ainsi désignée. Next émet d'ailleurs
    un avertissement au build tant qu'elle manque. Elle vient de `lib/site.ts`,
    qui la déduit de l'environnement.
  */
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },

  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "fr_FR",
    url: "/",
    title: SITE_NAME,
    description:
      "Discutez avec la version IA d'Arthur Mathon, Design System Lead/Product/Ops.",
    /*
      Le héro de l'Ours, persona par défaut : c'est l'image qu'un visiteur voit
      en arrivant, donc celle qu'il reconnaît dans un fil. Générer une carte à
      la volée aurait produit un visuel que le site ne montre nulle part.
    */
    images: [
      {
        url: "/hero/ours-light.webp",
        width: 1200,
        height: 630,
        alt: "Illustration de l'Ours, persona par défaut du portfolio d'Arthur Mathon",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description:
      "Discutez avec la version IA d'Arthur Mathon, Design System Lead/Product/Ops.",
    images: ["/hero/ours-light.webp"],
  },

  robots: {
    index: true,
    follow: true,
    // Les aperçus riches sont l'intérêt même d'un portfolio partagé.
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },

  authors: [{ name: AUTEUR.nom, url: AUTEUR.linkedin }],
  creator: AUTEUR.nom,
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
        {/*
          Mesure d'audience et de performance.

          Vercel Analytics **ne pose aucun cookie** et n'identifie personne :
          il compte des pages vues et des référents, pas des individus. C'est
          ce qui dispense d'un bandeau de consentement — un portfolio dont la
          première interaction serait un refus de traceurs commencerait mal.

          **Montés en production seulement, et c'est délibéré.** Laissés
          inconditionnels, les deux composants chargent en développement un
          script de débogage depuis `va.vercel-scripts.com` : deux requêtes
          vers un tiers à chaque page, y compris pendant toute la suite de
          tests — qui n'a aucune raison de dépendre du réseau, et qui tourne
          ici derrière une interception TLS d'entreprise. Mesuré le
          2026-08-13, après l'avoir cru l'inverse.

          Retirer ces deux lignes suffit à tout désactiver.
        */}
        {process.env.NODE_ENV === "production" && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
