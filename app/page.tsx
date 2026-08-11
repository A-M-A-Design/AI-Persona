import ArticlesSection from "../components/ArticlesSection";
import Chat, { type PersonaPublic } from "../components/chat/Chat";
import SiteHeader from "../components/header/SiteHeader";
import { getPersonas } from "../lib/personas";

export default function Home() {
  const personas: PersonaPublic[] = Object.values(getPersonas()).map((p) => ({
    id: p.id,
    emoji: p.emoji,
    suggestedQuestions: p.suggestedQuestions,
  }));

  // Chat porte l'état de la conversation : au repos il rend le héro de la
  // maquette, et le remplace par le fil dès le premier message.
  return (
    <main className="page">
      <SiteHeader />
      <Chat personas={personas} />
      <ArticlesSection />
    </main>
  );
}
