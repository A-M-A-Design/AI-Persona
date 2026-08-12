import ArticlesSection from "../components/ArticlesSection";
import Chat, { type PersonaPublic } from "../components/chat/Chat";
import SiteHeader from "../components/header/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { getPublicPersonas } from "../lib/personas";

export default function Home() {
  const personas: PersonaPublic[] = getPublicPersonas();

  // Barre de navigation et pied de page sont pleine largeur et collants : ils
  // encadrent le conteneur de page, qui garde ses marges. Chat porte l'état de
  // la conversation : au repos il rend le héro, et le remplace par le fil dès
  // le premier message.
  return (
    <>
      <SiteHeader />
      {/* Le slideshow est pleine largeur, comme la barre et le pied de page :
          il sort donc du conteneur à marges, qui ne cadre plus que les
          articles. `main` l'englobe quand même — c'est le contenu principal,
          et le lien d'évitement doit y mener, pas le sauter.

          `tabIndex={-1}` : sans lui, certains navigateurs déplacent la vue
          sans déplacer le focus, et la tabulation suivante repart du début. */}
      <main id="contenu" tabIndex={-1}>
        <Chat personas={personas} />
        <div className="page">
          <ArticlesSection />
        </div>
      </main>
      <SiteFooter personas={personas} />
    </>
  );
}
