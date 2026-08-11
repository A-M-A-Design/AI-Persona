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

  // La barre de navigation est pleine largeur et collante : elle sort donc du
  // conteneur de page, qui garde ses marges. Chat porte l'état de la
  // conversation : au repos il rend le héro, et le remplace par le fil dès le
  // premier message.
  return (
    <>
      <SiteHeader />
      <main className="page">
        <Chat personas={personas} />
        <ArticlesSection />
      </main>
    </>
  );
}
