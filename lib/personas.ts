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
