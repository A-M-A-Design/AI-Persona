import Chat, { type PersonaPublic } from "../components/chat/Chat";
import ColorModeToggle from "../components/header/ColorModeToggle";
import { getPersonas } from "../lib/personas";

export default function Home() {
  const personas: PersonaPublic[] = Object.values(getPersonas()).map((p) => ({
    id: p.id,
    emoji: p.emoji,
    suggestedQuestions: p.suggestedQuestions,
  }));

  return (
    <main className="chat-page">
      <header className="chat-page__header">
        <div>
          <h1 className="chat-page__title">Arthur Mathon</h1>
          <p className="chat-page__subtitle">
            Design System Lead · Product · Ops — discutez avec ma version IA
          </p>
        </div>
        <ColorModeToggle />
      </header>
      <Chat personas={personas} />
    </main>
  );
}
