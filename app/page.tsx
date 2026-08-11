import Chat, { type PersonaPublic } from "../components/chat/Chat";
import ColorModeToggle from "../components/header/ColorModeToggle";
import HeaderSubtitle from "../components/header/HeaderSubtitle";
import LangToggle from "../components/header/LangToggle";
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
          <HeaderSubtitle />
        </div>
        <div className="chat-page__controls">
          <PersonaSwitcher />
          <div className="chat-page__controls-row">
            <LangToggle />
            <ColorModeToggle />
          </div>
        </div>
      </header>
      <Chat personas={personas} />
    </main>
  );
}
