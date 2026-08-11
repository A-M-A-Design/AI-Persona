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
  modulator: Record<Lang, string>;
  suggestedQuestions: Record<Lang, string[]>;
};

export function isPersonaId(value: unknown): value is PersonaId {
  return typeof value === "string" && (PERSONA_IDS as readonly string[]).includes(value);
}

let cache: Record<PersonaId, Persona> | null = null;

export function getPersonas(): Record<PersonaId, Persona> {
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
