"use client";

// Le bot invite à basculer vers un autre persona quand la question relève de
// son domaine. Le nom cité devient cliquable : on change de persona sans
// quitter la conversation, et on peut creuser dans la foulée.
//
// Le texte de la réponse est du texte brut : on y repère les noms de personas
// et on les remplace par des boutons. Le reste passe intact.
import type { ReactNode } from "react";
import { tf, type Lang } from "../../lib/i18n";
import { persistSetting } from "../useSettings";
import type { PersonaPublic } from "./Chat";

/**
 * Le nom sans son article : le bot écrit « la Libellule », « l'Ours », « the
 * Bear », et parfois en gras markdown. On cherche donc le seul substantif, et
 * on laisse l'expression régulière rattraper ce qui l'entoure.
 */
function substantif(nom: string): string {
  return nom.replace(/^(l['’]|la |le |les |the )/i, "").trim();
}

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  // Un seul passage : les deux langues sont acceptées, le bot pouvant citer le
  // nom anglais dans une réponse française et l'inverse.
  const mots = cibles.flatMap((p) =>
    [p.name.fr, p.name.en].map((n) => ({ id: p.id, mot: substantif(n) })),
  );
  const motif = new RegExp(
    `(\\*{0,2}(?:l['’]|la |le |the )?(?:${mots.map((m) => echapper(m.mot)).join("|")})\\*{0,2})`,
    "gi",
  );

  const morceaux: ReactNode[] = [];
  let dernier = 0;
  let trouve: RegExpExecArray | null;

  while ((trouve = motif.exec(texte)) !== null) {
    const brut = trouve[0];
    const nu = brut.replace(/\*/g, "");
    const cible = mots.find((m) => nu.toLowerCase().endsWith(m.mot.toLowerCase()));
    if (!cible) continue;

    if (trouve.index > dernier) morceaux.push(texte.slice(dernier, trouve.index));
    const persona = cibles.find((p) => p.id === cible.id)!;
    morceaux.push(
      <button
        key={`${trouve.index}-${cible.id}`}
        type="button"
        className="chat-modal__persona-link"
        // Le libellé visible est le nom cité ; le nom accessible dit ce que le
        // bouton fait, sans quoi « la Libellule » seule n'annonce rien.
        aria-label={tf(lang, "switchToPersona", { name: persona.name[lang] })}
        onClick={() => {
          document.documentElement.setAttribute("data-persona", persona.id);
          persistSetting({ persona: persona.id }, "nav");
        }}
      >
        {nu}
      </button>,
    );
    dernier = trouve.index + brut.length;
  }

  if (dernier === 0) return <>{texte}</>;
  if (dernier < texte.length) morceaux.push(texte.slice(dernier));
  return <>{morceaux}</>;
}
