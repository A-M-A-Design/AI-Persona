import ArticlesSection from "../components/ArticlesSection";
import Chat, { type PersonaPublic } from "../components/chat/Chat";
import HeaderSubtitle from "../components/header/HeaderSubtitle";
import HeroIllustration from "../components/header/HeroIllustration";
import SettingsBar from "../components/header/SettingsBar";
import SiteFooter from "../components/SiteFooter";
import { getPersonas } from "../lib/personas";

export default function Home() {
  const personas: PersonaPublic[] = Object.values(getPersonas()).map((p) => ({
    id: p.id,
    emoji: p.emoji,
    suggestedQuestions: p.suggestedQuestions,
  }));

  return (
    <>
      <main className="chat-page">
        <header className="hero">
          <HeroIllustration />
          <h1 className="chat-page__title">Arthur Mathon</h1>
          <HeaderSubtitle />
          <SettingsBar />
        </header>
        <Chat personas={personas} />
        <ArticlesSection />
      </main>
      <SiteFooter />
    </>
  );
}
