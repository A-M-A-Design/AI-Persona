"use client";

// Panneau de conversation, d'après les frames modal-open / chat-on.
//
// Desktop : 640 px centré sur un scrim ; tablette et mobile : plein écran.
// Le fil s'ancre en bas, les blocs sont alignés à droite, la question de
// l'utilisateur est une pastille sombre et la réponse du texte simple.
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LINKS } from "../../lib/articles";
import { t, type Lang } from "../../lib/i18n";
import { CloseIcon } from "../Icons";
import type { PersonaPublic } from "./Chat";
import Composer from "./Composer";
import PersonaMention from "./PersonaMention";
import SuggestedQuestions from "./SuggestedQuestions";

export type Exchange = { id: string; question: string; answer: string | null };

type Props = {
  lang: Lang;
  /** Pour rendre cliquables les personas cités dans les réponses. */
  personas: PersonaPublic[];
  /** Le persona qui parle : il ne se cite pas lui-même. */
  persona: string;
  exchanges: Exchange[];
  questions: string[];
  busy: boolean;
  /** `null` si tout va bien. */
  error: "jour" | "rafale" | "panne" | null;
  onSend: (text: string) => void;
  onClose: () => void;
  /** Vide le fil et restaure les questions suggérées, sans fermer le panneau. */
  onReset: () => void;
};

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export default function ChatModal({
  lang,
  personas,
  persona,
  exchanges,
  questions,
  busy,
  error,
  onSend,
  onClose,
  onReset,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Le panneau reste monté le temps de l'animation de sortie.
  const [closing, setClosing] = useState(false);
  // Le persona qui parle : son invitation de pied de page sert de sortie
  // quand la limite du jour est atteinte.
  const actif = personas.find((p) => p.id === persona) ?? personas[0];
  const requestClose = useCallback(() => setClosing(true), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [exchanges]);

  /*
    Annonce vocale de la réponse.

    Le fil lui-même n'est plus une région live : le texte y arrive token par
    token, et chaque insertion faisait ré-annoncer le paragraphe entier depuis
    le début — la lecture était inutilisable pendant la génération. La question
    de l'utilisateur y était annoncée elle aussi, alors qu'il vient de la
    taper.

    À la place, une région de statut hors écran reçoit deux valeurs seulement :
    « réponse en cours » au départ, puis la réponse complète une fois le flux
    terminé. Elle ne change donc que deux fois par échange.
  */
  const derniere = exchanges[exchanges.length - 1]?.answer ?? null;
  const [annonce, setAnnonce] = useState("");
  useEffect(() => {
    if (busy) {
      setAnnonce(t(lang, "thinking"));
      return;
    }
    if (derniere) setAnnonce(derniere);
  }, [busy, derniere, lang]);

  /*
    Arrière-plan neutralisé tant que le panneau est ouvert. `aria-modal` suffit
    aux lecteurs d'écran récents, mais ne retire ni les liens de la tabulation
    ni le contenu du mode exploration des plus anciens. `inert` le fait pour
    les deux, et complète le piège de focus posé plus bas.
  */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const voisins = Array.from(document.body.children).filter(
      (el) => el !== root && !el.hasAttribute("inert"),
    );
    voisins.forEach((el) => el.setAttribute("inert", ""));
    return () => voisins.forEach((el) => el.removeAttribute("inert"));
  }, []);

  /*
    Le retour du focus à la fermeture n'est **pas** géré ici, mais dans `Chat` :
    seul l'appelant sait ce qui avait le focus avant l'ouverture.

    Deux raisons de ne pas le faire dans ce composant. `autoFocus` sur le champ
    du panneau s'applique à l'insertion du nœud dans le DOM, donc **avant** tout
    effet : lu depuis un effet, `document.activeElement` désigne déjà ce champ.
    Et en mode strict, React joue montage → purge → montage, si bien qu'une
    restauration posée dans une purge se déclenche pendant que le panneau est
    encore ouvert.
  */

  // Échap ferme, Tab reste dans le panneau, et la page ne défile plus derrière.
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        requestClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [requestClose]);

  // Monté sur <body> plutôt que dans <main> : le panneau est en position fixe,
  // le rendu ne change pas, mais il devient un frère du contenu — condition
  // pour pouvoir rendre celui-ci inerte sans s'inerter soi-même.
  return createPortal(
    <div
      className={closing ? "chat-modal chat-modal--closing" : "chat-modal"}
      ref={rootRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        className="chat-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-modal-title"
        ref={panelRef}
        // Le démontage n'a lieu qu'une fois l'animation de sortie terminée.
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) onClose();
        }}
      >
        <header className="chat-modal__header">
          <div className="chat-modal__actions">
            {/* Rien à effacer tant que le fil est vide : le bouton n'apparaît
                qu'une fois la conversation entamée. */}
            {exchanges.length > 0 ? (
              <button
                type="button"
                // Tertiaire et non secondaire : la maquette montre une pastille
                // contournée sur fond transparent, ce que porte le variant
                // tertiaire (bg transparent, bordure et libellé sombres).
                className="ama-button ama-button--tertiary chat-modal__new"
                onClick={onReset}
                disabled={busy}
              >
                {t(lang, "newChat")}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="chat-modal__close"
              onClick={requestClose}
              aria-label={t(lang, "closeChat")}
            >
              <CloseIcon />
            </button>
          </div>
          <h2 className="chat-modal__title" id="chat-modal-title">
            {t(lang, "chatTitle")}
          </h2>
        </header>

        {/* Hors écran : porte l'annonce, pas l'affichage. */}
        <p className="a11y-hidden" role="status">
          {annonce}
        </p>

        <div className="chat-modal__body">
          {exchanges.map((x) => (
            <div className="chat-modal__exchange" key={x.id}>
              <p className="chat-modal__question">{x.question}</p>
              {x.answer !== null ? (
                <p className="chat-modal__answer">
                  <PersonaMention
                    texte={x.answer}
                    personas={personas}
                    actif={persona}
                    lang={lang}
                  />
                </p>
              ) : (
                busy && (
                  <p className="chat-modal__answer chat-modal__answer--pending">
                    {t(lang, "thinking")}
                  </p>
                )
              )}
            </div>
          ))}

          {error && (
            <div className="ama-message ama-message--warning" role="alert">
              <div className="ama-message__header">
                <p className="ama-message__text">
                  {t(
                    lang,
                    error === "jour"
                      ? "errorRateDaily"
                      : error === "rafale"
                        ? "errorRateBurst"
                        : "error",
                  )}
                </p>
              </div>

              {/*
                La limite du jour n'est pas un incident : la conversation a dit
                ce qu'elle avait à dire. On invite donc à la continuer ailleurs,
                **dans la voix du persona** — `footerHeading` porte déjà les
                trois formules (« On boit un café ? », « Croisons nos chemins »,
                « RDV IRL ? »), inutile d'en écrire d'autres qui divergeraient.

                Deux vrais liens, atteignables au clavier et nommés : c'est la
                seule sortie offerte au visiteur à ce moment-là.
              */}
              {error === "jour" && (
                <div className="chat-modal__limite">
                  <p className="chat-modal__limite-invite">
                    {actif?.footerHeading[lang] ?? t(lang, "errorRateDailyInvite")}
                  </p>
                  <p className="chat-modal__limite-liens">
                    <a
                      className="chat-modal__article-link"
                      href={LINKS.linkedin}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t(lang, "linkedin")}
                    </a>
                    <a className="chat-modal__article-link" href={LINKS.email}>
                      {t(lang, "mail")}
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <footer className="chat-modal__footer">
          {questions.length > 0 && (
            <SuggestedQuestions
              className="chat-modal__chips"
              label={t(lang, "suggestions")}
              questions={questions}
              onPick={onSend}
            />
          )}
          <Composer
            className="chat-modal__composer"
            disabled={busy}
            placeholder={t(lang, "askAnything")}
            label={t(lang, "questionLabel")}
            sendLabel={t(lang, "letsChat")}
            onSend={onSend}
            autoFocus
          />
        </footer>
      </div>
    </div>,
    document.body,
  );
}
