// Détection de la langue du message de l'utilisateur (client-safe).
//
// Motif : demander au modèle de « suivre la langue de l'utilisateur » ne suffit
// pas. Une question anglaise courte posée avec l'interface en français obtenait
// une réponse en français, la base de connaissance étant elle-même rédigée en
// français. On tranche donc côté serveur et on impose la langue au modèle.
//
// Le périmètre est volontairement étroit : le site n'expose que français et
// anglais. Un score par mots outils, insensible à la casse, avec les
// diacritiques françaises comme signal fort.
import type { Lang } from "./i18n";

// Mots retenus pour être discriminants : ceux communs aux deux langues
// (« me », « on », « son », « as »…) sont volontairement absents.
const FR = new Set([
  "le", "la", "les", "un", "une", "des", "du", "au", "aux", "et", "est", "sont",
  "je", "tu", "il", "elle", "nous", "vous", "ils", "mon", "ma", "mes", "ton",
  "ta", "tes", "ses", "notre", "votre", "leur", "quoi", "comment", "pourquoi",
  "quel", "quelle", "quels", "quelles", "dans", "avec", "pour", "sur", "sous",
  "ne", "pas", "plus", "chez", "qui", "que", "quand", "aussi", "très", "être",
  "fait", "faire", "peux", "peut", "parle", "raconte", "donne", "ça", "cette",
  "ce", "ces", "toi", "moi", "es", "as", "ai", "vraiment", "alors",
]);

const EN = new Set([
  "the", "is", "are", "was", "were", "am", "you", "your", "yours", "my", "mine",
  "his", "her", "their", "our", "what", "how", "why", "which", "who", "whose",
  "with", "for", "from", "about", "into", "does", "did", "do", "don", "can",
  "could", "would", "should", "will", "tell", "give", "explain", "and", "but",
  "not", "there", "these", "those", "this", "that", "they", "have", "has",
  "had", "been", "being", "current", "role", "work", "project",
]);

const DIACRITICS = /[àâäçéèêëîïôöùûüÿœ]/i;

/**
 * Renvoie la langue détectée, ou null si le message ne porte pas assez de
 * signal — à l'appelant de retomber sur la langue de l'interface.
 */
export function detectLang(text: string): Lang | null {
  const words = text.toLowerCase().match(/[a-zàâäçéèêëîïôöùûüÿœ']+/gi);
  if (!words || words.length === 0) return null;

  let fr = 0;
  let en = 0;
  for (const w of words) {
    // Les élisions (« j'ai », « c'est », « qu'est-ce ») sont un marqueur
    // français que le découpage par mots ferait autrement disparaître.
    if (w.includes("'")) {
      fr += 1;
      const tail = w.split("'").pop();
      if (tail && FR.has(tail)) fr += 1;
      continue;
    }
    if (FR.has(w)) fr += 1;
    if (EN.has(w)) en += 1;
  }

  // Une diacritique française ne s'écrit pas par accident.
  if (DIACRITICS.test(text)) fr += 2;

  if (fr === en) return null;
  // Un écart d'un seul mot sur un message court est trop fragile pour trancher.
  if (Math.abs(fr - en) < 2 && words.length > 3) return null;
  return fr > en ? "fr" : "en";
}
