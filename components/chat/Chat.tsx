"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import Composer from "./Composer";
import MessageBubble from "./MessageBubble";
import SuggestedQuestions from "./SuggestedQuestions";

// Données publiques des personas, passées depuis le serveur (lib/personas.ts
// utilise fs et ne peut pas être importé côté client).
export type PersonaPublic = {
  id: string;
  emoji: string;
  suggestedQuestions: Record<"fr" | "en", string[]>;
};

type Props = {
  personas: PersonaPublic[];
};

function currentSettings() {
  const d = document.documentElement;
  return {
    persona: d.getAttribute("data-persona") ?? "ours",
    lang: d.getAttribute("lang") === "en" ? ("en" as const) : ("fr" as const),
  };
}

function messageText(parts: { type: string }[]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export default function Chat({ personas }: Props) {
  const { messages, sendMessage, status, error, clearError } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  // Persona/langue affichés côté client uniquement (évite un mismatch d'hydratation).
  const [settings, setSettings] = useState<{ persona: string; lang: "fr" | "en" }>({
    persona: "ours",
    lang: "fr",
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSettings(currentSettings());
    const update = () => setSettings(currentSettings());
    window.addEventListener("ai-persona:settings", update);
    return () => window.removeEventListener("ai-persona:settings", update);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const busy = status === "submitted" || status === "streaming";
  const activePersona =
    personas.find((p) => p.id === settings.persona) ?? personas[0];

  function send(text: string) {
    const s = currentSettings();
    setSettings(s);
    clearError();
    sendMessage({ text }, { body: { persona: s.persona, lang: s.lang } });
  }

  return (
    <div className="chat">
      <div className="chat__messages" aria-live="polite">
        {messages.length === 0 && (
          <>
            <MessageBubble
              role="assistant"
              avatarEmoji={activePersona.emoji}
              text={
                settings.lang === "fr"
                  ? "Bonjour ! Je suis la version IA d'Arthur. Posez-moi vos questions sur son parcours, ses projets ou sa façon de travailler."
                  : "Hi! I'm Arthur's AI self. Ask me anything about his background, projects or the way he works."
              }
            />
            <SuggestedQuestions
              questions={activePersona.suggestedQuestions[settings.lang]}
              onPick={send}
            />
          </>
        )}

        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role === "user" ? "user" : "assistant"}
            avatarEmoji={activePersona.emoji}
            text={messageText(m.parts)}
          />
        ))}

        {status === "submitted" && (
          <div className="chat__row chat__row--assistant">
            <span className="chat__avatar" aria-hidden="true">
              {activePersona.emoji}
            </span>
            <div className="wel-skeleton chat__skeleton" aria-label="Réponse en cours…" />
          </div>
        )}

        {error && (
          <div className="wel-message wel-message--warning" role="alert">
            <div className="wel-message__header">
              <p className="wel-message__text">
                {settings.lang === "fr"
                  ? "Oups, quelque chose a coincé. Réessayez dans un instant."
                  : "Oops, something went wrong. Please try again."}
              </p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <Composer
        disabled={busy}
        placeholder={
          settings.lang === "fr" ? "Posez votre question…" : "Ask your question…"
        }
        onSend={send}
      />
    </div>
  );
}
