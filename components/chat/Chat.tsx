"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef } from "react";
import { t } from "../../lib/i18n";
import Hero from "../Hero";
import PersonaGlyph from "../PersonaGlyph";
import { readCurrentSettings, useSettings } from "../useSettings";
import Composer from "./Composer";
import MessageBubble from "./MessageBubble";

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

function messageText(parts: { type: string }[]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export default function Chat({ personas }: Props) {
  const { messages, sendMessage, status, error, clearError, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const settings = useSettings();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const busy = status === "submitted" || status === "streaming";
  const started = messages.length > 0;
  const activePersona =
    personas.find((p) => p.id === settings.persona) ?? personas[0];

  function send(text: string) {
    // Settings relus au moment de l'envoi : un switch de persona/langue en
    // cours de conversation change la voix du bot au message suivant.
    const s = readCurrentSettings();
    clearError();
    sendMessage({ text }, { body: { persona: s.persona, lang: s.lang } });
  }

  // Au repos, la maquette ne montre que le héro et sa barre de chat. Les
  // questions suggérées y sont intégrées, sous le champ, et disparaissent dès
  // que la conversation démarre.
  if (!started) {
    return (
      <Hero
        lang={settings.lang}
        persona={settings.persona}
        disabled={busy}
        questions={activePersona.suggestedQuestions[settings.lang]}
        onSend={send}
      />
    );
  }

  return (
    <section className="chat">
      <div className="chat__toolbar">
        <button
          type="button"
          className="wel-button wel-button--tertiary wel-button--sm"
          onClick={() => {
            clearError();
            setMessages([]);
          }}
        >
          {t(settings.lang, "newChat")}
        </button>
      </div>

      <div className="chat__messages" aria-live="polite">
        <MessageBubble
          role="assistant"
          persona={activePersona.id}
          text={t(settings.lang, "welcome")}
        />

        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role === "user" ? "user" : "assistant"}
            persona={activePersona.id}
            text={messageText(m.parts)}
          />
        ))}

        {status === "submitted" && (
          <div className="chat__row chat__row--assistant">
            <span className="chat__avatar" aria-hidden="true">
              <PersonaGlyph persona={activePersona.id} className="chat__avatar-glyph" />
            </span>
            <div
              className="wel-skeleton chat__skeleton"
              aria-label={t(settings.lang, "thinking")}
            />
          </div>
        )}

        {error && (
          <div className="wel-message wel-message--warning" role="alert">
            <div className="wel-message__header">
              <p className="wel-message__text">{t(settings.lang, "error")}</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <Composer
        disabled={busy}
        placeholder={t(settings.lang, "placeholder")}
        sendLabel={t(settings.lang, "send")}
        onSend={send}
        autoFocus
      />
    </section>
  );
}
