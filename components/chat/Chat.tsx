"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import PersonaSlideshow from "../hero/PersonaSlideshow";
import { readCurrentSettings, useSettings } from "../useSettings";
import ChatModal, { type Exchange } from "./ChatModal";

// Données publiques des personas, passées depuis le serveur (lib/personas.ts
// utilise fs et ne peut pas être importé côté client).
export type PersonaPublic = {
  id: string;
  emoji: string;
  name: Record<"fr" | "en", string>;
  tagline: Record<"fr" | "en", string>;
  chatHeading: Record<"fr" | "en", string>;
  footerHeading: Record<"fr" | "en", string>;
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

  /**
   * Retour du focus à la fermeture du panneau.
   *
   * Il ne revenait pas : le focus retombait sur `<body>`, d'où l'exploration
   * au lecteur d'écran repart du haut de la page. Signalé le 2026-08-13.
   *
   * Deux pièges, tous deux dans le panneau — d'où la reprise ici. `autoFocus`
   * sur son champ s'applique à l'insertion du nœud, **avant** tout effet : lu
   * depuis un effet, `document.activeElement` désignait déjà ce champ, et la
   * fermeture y « revenait », c'est-à-dire sur un élément qu'on démontait. Et
   * en mode strict, React joue montage → purge → montage : une restauration
   * posée dans une purge se déclenchait panneau encore ouvert.
   *
   * L'effet ci-dessous tourne après le démontage du panneau, donc après que sa
   * purge a levé l'`inert` de la page : la cible est de nouveau focalisable.
   */
  const ouvrant = useRef<HTMLElement | null>(null);
  const futOuvert = useRef(false);
  useEffect(() => {
    if (open) {
      futOuvert.current = true;
      return;
    }
    if (!futOuvert.current) return;
    futOuvert.current = false;

    const cible = ouvrant.current;
    if (cible && document.contains(cible)) {
      cible.focus();
      return;
    }
    /*
      L'ouvrant a disparu : c'est le cas courant, pas l'exception. Poser une
      question suggérée la retire des chips (`setUsed`), donc le bouton qui a
      ouvert le panneau n'existe plus à la fermeture. On revient alors au champ
      du lanceur — là où la conversation a commencé et où elle se poursuivrait,
      plutôt qu'en haut de page.
    */
    document.getElementById("question")?.focus();
  }, [open]);

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
    // Ce qui avait le focus avant l'ouverture, retenu ici et non dans le
    // panneau : quand celui-ci se monte, son champ a déjà pris le focus par
    // `autoFocus`, avant tout effet. Capturé dans un gestionnaire d'événement,
    // donc à l'abri du double montage du mode strict.
    if (!open) ouvrant.current = document.activeElement as HTMLElement | null;
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
      <PersonaSlideshow
        personas={personas}
        colorMode={settings.colorMode}
        disabled={busy}
        questions={questions}
        onSend={send}
        // Le panneau ouvert fige le persona : sinon il changerait tout seul
        // sous une conversation en cours, et la voix du bot avec.
        paused={open}
      />
      {open && (
        <ChatModal
          lang={settings.lang}
          personas={personas}
          persona={settings.persona}
          exchanges={exchanges}
          questions={questions}
          busy={busy}
          /*
            La limite de débit n'est pas une panne : le visiteur n'a rien
            cassé, il doit patienter. Le lui dire évite qu'il réessaie
            aussitôt — et le message générique lui ferait croire à un bug.

            La route répond `{ error: "rate_limited" }` en 429 ; le SDK
            remonte le corps dans le message de l'erreur.
          */
          error={
            error
              ? /rate_limited/.test(error.message)
                ? /"fenetre":"jour"/.test(error.message)
                  ? "jour"
                  : "rafale"
                : "panne"
              : null
          }
          onSend={send}
          onClose={() => setOpen(false)}
          onReset={reset}
        />
      )}
    </>
  );
}
