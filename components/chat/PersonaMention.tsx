"use client";

// Le bot invite à basculer vers un autre persona quand la question relève de
// son domaine. Le nom cité devient cliquable : on change de persona sans
// quitter la conversation, et on peut creuser dans la foulée.
//
// Le texte de la réponse est du texte brut. Le découpage vit dans
// lib/persona-mention.ts, testé sans navigateur ; ici on ne fait que rendre
// les segments qu'il produit.
import Link from "next/link";
import { articlePath, ARTICLES } from "../../lib/articles";
import { tf, type Lang } from "../../lib/i18n";
import { segmenterReponse } from "../../lib/persona-mention";
import { persistSetting } from "../useSettings";
import type { PersonaPublic } from "./Chat";

export default function PersonaMention({
  texte,
  personas,
  actif,
  lang,
}: {
  texte: string;
  personas: PersonaPublic[];
  /** Le persona qui parle : se citer lui-même n'appellerait aucune bascule. */
  actif: string;
  lang: Lang;
}) {
  const cibles = personas.filter((p) => p.id !== actif);
  if (cibles.length === 0) return <>{texte}</>;

  // Les deux langues sont acceptées, le bot pouvant citer le nom anglais dans
  // une réponse française et l'inverse.
  const segments = segmenterReponse(
    texte,
    cibles.map((p) => ({ id: p.id, noms: [p.name.fr, p.name.en] })),
    // Les articles publiés cités par leur titre exact deviennent des liens vers
    // leur page. Le prompt demande au bot le titre littéral pour cette raison :
    // un titre paraphrasé ne serait pas reconnu ici.
    ARTICLES.flatMap((a) => [a.title.fr, a.title.en].map((titre) => ({ slug: a.slug, titre }))),
  );

  return (
    <>
      {segments.map((s, i) => {
        if (s.type === "texte") return s.texte;
        if (s.type === "article") {
          return (
            <Link key={`${i}-${s.slug}`} className="chat-modal__article-link" href={articlePath(s.slug)}>
              {s.libelle}
            </Link>
          );
        }
        const persona = cibles.find((p) => p.id === s.id)!;
        return (
          <button
            key={`${i}-${s.id}`}
            type="button"
            className="chat-modal__persona-link"
            // Le libellé visible est le nom cité ; le nom accessible dit ce que
            // le bouton fait, sans quoi « la Libellule » seule n'annonce rien.
            aria-label={tf(lang, "switchToPersona", { name: persona.name[lang] })}
            onClick={() => {
              document.documentElement.setAttribute("data-persona", persona.id);
              persistSetting({ persona: persona.id }, "nav");
            }}
          >
            {s.libelle}
          </button>
        );
      })}
    </>
  );
}
