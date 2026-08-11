import Chat, { type PersonaPublic } from "../components/chat/Chat";
import ColorModeToggle from "../components/header/ColorModeToggle";
import PersonaSwitcher from "../components/header/PersonaSwitcher";
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
        <div className="chat-page__controls">
          <PersonaSwitcher />
          <ColorModeToggle />
        </div>
      </header>
      <Chat personas={personas} />
    </main>
  );
}
