"use client";

/**
 * Accès rapide — le tout premier contenu du document.
 *
 * Il répond à deux constats d'une passe au lecteur d'écran (2026-08-13) :
 *
 * 1. **À l'ouverture, rien ne disait ce qu'est ce site.** Le premier élément
 *    annoncé était « lien, Aller au contenu », puis la barre de réglages. Le
 *    nom du site n'existait que dans le `<title>` — annoncé par certains
 *    lecteurs, à un moment que l'utilisateur ne contrôle pas, et jamais
 *    retrouvable en exploration. Il est désormais du contenu, en tête.
 *
 * 2. **Les raccourcis à touche unique ne parviennent pas au lecteur d'écran.**
 *    En mode exploration, NVDA et JAWS réservent les lettres à leur propre
 *    navigation — `f` va au champ de formulaire suivant, il n'atteindra jamais
 *    la page. `docs/accessibilite.md` l'annonçait comme une limite ; la passe
 *    l'a confirmé. Aucun contournement n'existe côté page : la seule réponse
 *    est d'offrir les mêmes destinations en **contrôles réels**, atteignables
 *    à la tabulation comme à l'exploration. C'est ce que sont ces liens.
 *
 * Hors écran au repos, visibles dès qu'ils reçoivent le focus — même principe
 * que le lien d'évitement, qu'ils englobent désormais.
 */
import { t, type Lang } from "../lib/i18n";
import { useSettings } from "./useSettings";

/** Destinations propres à la page d'accueil, absentes des pages articles. */
const CIBLES_ACCUEIL = [
  { href: "#question", cle: "skipToAsk" },
  { href: "#articles", cle: "skipToArticles" },
] as const;

export default function QuickAccess({ accueil = false }: { accueil?: boolean }) {
  const { lang }: { lang: Lang } = useSettings();

  return (
    <nav className="quick-access" aria-label={t(lang, "quickAccess")}>
      {/* Lu avant tout le reste, invisible à l'écran : la maquette n'a pas de
          bandeau de titre, et en ajouter un déplacerait le héro. */}
      <p className="a11y-hidden">{t(lang, "siteName")}</p>

      {accueil &&
        CIBLES_ACCUEIL.map((c) => (
          <a key={c.href} className="skip-link" href={c.href}>
            {t(lang, c.cle)}
          </a>
        ))}

      {/* En dernier, et conservé : il mène au contenu pour le *lire*, là où les
          deux précédents posent le focus sur une commande. Deux besoins
          distincts, deux liens. */}
      <a className="skip-link" href="#contenu">
        {t(lang, "skipToContent")}
      </a>
    </nav>
  );
}
