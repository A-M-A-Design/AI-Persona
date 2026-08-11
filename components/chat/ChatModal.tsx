"use client";

// Panneau de conversation, d'après les frames modal-open / chat-on.
//
// Desktop : 640 px centré sur un scrim ; tablette et mobile : plein écran.
// Le fil s'ancre en bas, les blocs sont alignés à droite, la question de
// l'utilisateur est une pastille sombre et la réponse du texte simple.
import { useEffect, useRef } from "react";
import { t, type Lang } from "../../lib/i18n";
import Composer from "./Composer";
import SuggestedQuestions from "./SuggestedQuestions";

export type Exchange = { id: string; question: string; answer: string | null };

type Props = {
  lang: Lang;
  exchanges: Exchange[];
  questions: string[];
  busy: boolean;
  error: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
};

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export default function ChatModal({
  lang,
  exchanges,
  questions,
  busy,
  error,
  onSend,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [exchanges]);

  // Échap ferme, Tab reste dans le panneau, et la page ne défile plus derrière.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
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
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="chat-modal"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="chat-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-modal-title"
        ref={panelRef}
      >
        <header className="chat-modal__header">
          <div className="chat-modal__actions">
            <button
              type="button"
              className="chat-modal__close"
              onClick={onClose}
              aria-label={t(lang, "closeChat")}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <h2 className="chat-modal__title" id="chat-modal-title">
            {t(lang, "chatTitle")}
          </h2>
        </header>

        <div className="chat-modal__body" aria-live="polite">
          {exchanges.map((x) => (
            <div className="chat-modal__exchange" key={x.id}>
              <p className="chat-modal__question">{x.question}</p>
              {x.answer !== null ? (
                <p className="chat-modal__answer">{x.answer}</p>
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
            <div className="wel-message wel-message--warning" role="alert">
              <div className="wel-message__header">
                <p className="wel-message__text">{t(lang, "error")}</p>
              </div>
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
            sendLabel={t(lang, "letsChat")}
            onSend={onSend}
            autoFocus
          />
        </footer>
      </div>
    </div>
  );
}
