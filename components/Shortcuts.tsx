"use client";

// Raccourcis clavier globaux, à touche unique.
//
// WCAG 2.1.4 « Character Key Shortcuts » impose l'une de trois échappatoires
// dès qu'un raccourci n'utilise qu'une touche imprimable sans modificateur :
// pouvoir le désactiver, pouvoir le remapper, ou ne l'activer qu'au focus. Le
// carrousel emploie la troisième pour ses flèches ; ici, où les raccourcis
// valent partout, c'est la première — l'aide porte la case à cocher qui les
// coupe, et le choix est persisté.
//
// Trois gardes protègent la saisie : aucun modificateur, jamais dans un champ,
// et l'aide se ferme à Échap comme une boîte de dialogue.
import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "../lib/i18n";
import { persistSetting, useSettings } from "./useSettings";

/** Cible → touche. Aucune ne heurte un raccourci de navigateur courant. */
const RACCOURCIS = [
  { touche: "m", cle: "shortcutMain", cible: "#contenu" },
  { touche: "n", cle: "shortcutNav", cible: ".site-nav__inner select, .site-nav__home" },
  { touche: "f", cle: "shortcutFooter", cible: ".site-footer__link" },
] as const;

function viser(selecteur: string) {
  const el = document.querySelector<HTMLElement>(selecteur);
  if (!el) return;
  el.focus();
  // Le focus ne fait pas défiler un conteneur déjà visible : on s'en assure,
  // sinon le raccourci paraît sans effet quand la cible est hors écran.
  el.scrollIntoView({ block: "center", behavior: "auto" });
}

export default function Shortcuts() {
  const { lang, shortcuts } = useSettings();
  const [aide, setAide] = useState(false);
  const fermerRef = useRef<HTMLButtonElement>(null);

  const basculer = useCallback(() => {
    const actif = !shortcuts;
    document.documentElement.setAttribute("data-shortcuts", actif ? "on" : "off");
    persistSetting({ shortcuts: actif });
  }, [shortcuts]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && aide) {
        setAide(false);
        return;
      }
      // L'aide reste atteignable même raccourcis coupés : c'est là qu'on les
      // rallume. Tout le reste s'arrête.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const cible = e.target as HTMLElement | null;
      if (cible?.closest("input, textarea, select, [contenteditable]")) return;

      if (e.key === "?") {
        e.preventDefault();
        setAide((v) => !v);
        return;
      }
      if (!shortcuts) return;

      const trouve = RACCOURCIS.find((r) => r.touche === e.key.toLowerCase());
      if (!trouve) return;
      e.preventDefault();
      viser(trouve.cible);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [shortcuts, aide]);

  useEffect(() => {
    if (aide) fermerRef.current?.focus();
  }, [aide]);

  if (!aide) {
    // Hors écran mais atteignable : la seule façon de découvrir les raccourcis
    // sans les connaître. Le lien d'évitement suit le même principe.
    return (
      <button type="button" className="shortcuts__hint" onClick={() => setAide(true)}>
        {t(lang, "shortcutsHint")}
      </button>
    );
  }

  return (
    <div className="shortcuts" role="dialog" aria-modal="true" aria-labelledby="shortcuts-titre">
      <div className="shortcuts__panel">
        <h2 id="shortcuts-titre">{t(lang, "shortcutsTitle")}</h2>
        <dl className="shortcuts__list">
          {RACCOURCIS.map((r) => (
            <div key={r.touche}>
              <dt>
                <kbd>{r.touche.toUpperCase()}</kbd>
              </dt>
              <dd>{t(lang, r.cle)}</dd>
            </div>
          ))}
          <div>
            <dt>
              <kbd>?</kbd>
            </dt>
            <dd>{t(lang, "shortcutHelp")}</dd>
          </div>
        </dl>

        <label className="shortcuts__toggle">
          <input type="checkbox" checked={shortcuts} onChange={basculer} />
          {t(lang, "shortcutsEnabled")}
        </label>

        <button
          type="button"
          className="ama-button ama-button--primary"
          ref={fermerRef}
          onClick={() => setAide(false)}
        >
          {t(lang, "close")}
        </button>
      </div>
    </div>
  );
}
