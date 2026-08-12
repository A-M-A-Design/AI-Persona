// Chargement des définitions de personas (serveur uniquement — utilise fs).
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const PERSONA_IDS = ["ours", "corneille", "libellule"] as const;
export type PersonaId = (typeof PERSONA_IDS)[number];
export type Lang = "fr" | "en";

export type Persona = {
  id: PersonaId;
  emoji: string;
  name: Record<Lang, string>;
  /** Domaine que le persona met en avant : design system, produit, IA et ops. */
  skill: Record<Lang, string>;
  /** Sous-titre du héro — la maquette v2 le décline par skill. */
  tagline: Record<Lang, string>;
  /** Intitulé du lanceur de chat, « Parlez à l'Ours en moi ». */
  chatHeading: Record<Lang, string>;
  /**
   * Invitation du pied de page. Propre au persona, et surtout distincte du
   * bouton d'envoi : « Discutons » des deux côtés faisait doublon, et laissait
   * croire que le pied de page ouvrait lui aussi la conversation.
   */
  footerHeading: Record<Lang, string>;
  /** Ton et style. Le skill, lui, est composé dans lib/prompt.ts. */
  modulator: Record<Lang, string>;
  suggestedQuestions: Record<Lang, string[]>;
};

export function isPersonaId(value: unknown): value is PersonaId {
  return typeof value === "string" && (PERSONA_IDS as readonly string[]).includes(value);
}

let cache: Record<PersonaId, Persona> | null = null;

export function getPersonas(): Record<PersonaId, Persona> {
  // En développement on relit à chaque appel : les JSON sont lus par `fs`, le
  // bundler ne les surveille donc pas, et un cache de module figeait les
  // personas dans l'état où ils étaient au premier rendu. Même raisonnement
  // que `loadStablePrefix` dans lib/prompt.ts.
  if (process.env.NODE_ENV !== "production") cache = null;
  if (!cache) {
    const dir = join(process.cwd(), "personas");
    cache = Object.fromEntries(
      PERSONA_IDS.map((id) => [
        id,
        JSON.parse(readFileSync(join(dir, `${id}.json`), "utf8")) as Persona,
      ]),
    ) as Record<PersonaId, Persona>;
  }
  return cache;
}

export function getPersona(id: PersonaId): Persona {
  return getPersonas()[id];
}

/**
 * Sous-ensemble transmissible au client : tout sauf le modulateur et le
 * domaine, qui ne servent qu'au prompt et n'ont rien à faire dans le HTML.
 * Les deux routes en ont besoin — l'accueil pour le slideshow, les articles
 * pour le pied de page — d'où cette fabrique unique.
 */
export function getPublicPersonas() {
  return Object.values(getPersonas()).map((p) => ({
    id: p.id,
    emoji: p.emoji,
    name: p.name,
    tagline: p.tagline,
    chatHeading: p.chatHeading,
    footerHeading: p.footerHeading,
    suggestedQuestions: p.suggestedQuestions,
  }));
}
