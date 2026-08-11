"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import Hero from "../Hero";
import { readCurrentSettings, useSettings } from "../useSettings";
import ChatModal, { type Exchange } from "./ChatModal";

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
  const [open, setOpen] = useState(false);
  // Une question suggérée déjà posée ne réapparaît pas dans les chips.
  const [used, setUsed] = useState<string[]>([]);

  const busy = status === "submitted" || status === "streaming";
  const activePersona =
    personas.find((p) => p.id === settings.persona) ?? personas[0];
  const questions = activePersona.suggestedQuestions[settings.lang].filter(
    (q) => !used.includes(q),
  );

  // La maquette apparie question et réponse : on regroupe le flux plat de
  // useChat en échanges, la réponse restant nulle tant qu'elle n'a pas commencé.
  const exchanges: Exchange[] = [];
  for (const m of messages) {
    const text = messageText(m.parts);
    if (m.role === "user") {
      exchanges.push({ id: m.id, question: text, answer: null });
    } else if (exchanges.length > 0) {
      exchanges[exchanges.length - 1].answer = text;
    }
  }

  function send(text: string) {
    // Settings relus au moment de l'envoi : un switch de persona/langue en
    // cours de conversation change la voix du bot au message suivant.
    const s = readCurrentSettings();
    clearError();
    setUsed((u) => (u.includes(text) ? u : [...u, text]));
    setOpen(true);
    sendMessage({ text }, { body: { persona: s.persona, lang: s.lang } });
  }

  // Repartir de zéro : le fil est vidé et les questions suggérées reviennent,
  // le panneau reste ouvert sur son état d'accueil.
  function reset() {
    clearError();
    setMessages([]);
    setUsed([]);
  }

  return (
    <>
      <Hero
        lang={settings.lang}
        persona={settings.persona}
        disabled={busy}
        questions={questions}
        onSend={send}
      />
      {open && (
        <ChatModal
          lang={settings.lang}
          exchanges={exchanges}
          questions={questions}
          busy={busy}
          error={Boolean(error)}
          onSend={send}
          onClose={() => setOpen(false)}
          onReset={reset}
        />
      )}
    </>
  );
}
