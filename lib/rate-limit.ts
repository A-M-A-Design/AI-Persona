import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Limite de débit de la route de chat, par adresse IP.
 *
 * Pourquoi : `/api/chat` appelle un modèle payant avec **notre** clé. Sans
 * limite, un script quelconque consomme le quota — ou la facture — en quelques
 * minutes. C'est le seul poste du MVP qui protège de l'extérieur.
 *
 * Deux fenêtres, parce qu'elles répondent à deux abus différents :
 *
 * - **la conversation** — **30 questions par jour**, la limite voulue. Une
 *   visite curieuse en pose une dizaine ; au-delà, la conversation a dit ce
 *   qu'elle avait à dire, et c'est le moment d'inviter à la continuer
 *   ailleurs — le panneau le fait, persona par persona.
 * - **la rafale** — 5 par minute, garde-fou et non plafond d'usage. Sans lui,
 *   une seule adresse tire ses 30 questions en trois secondes et épuise le
 *   quota Mistral du compte, qui plafonne à ~2 réponses par minute, pour tous
 *   les autres visiteurs en même temps.
 *
 * Les deux valeurs sont réglables par variable d'environnement : les ajuster ne
 * doit pas demander un déploiement de code.
 */

const PAR_MINUTE = Number(process.env.RATE_LIMIT_PAR_MINUTE ?? 5);
const PAR_JOUR = Number(process.env.RATE_LIMIT_PAR_JOUR ?? 30);

export type Verdict = {
  autorise: boolean;
  /** Secondes avant que la fenêtre ne se rouvre — sert l'en-tête `Retry-After`. */
  attente: number;
  /** Fenêtre qui a refusé, pour le journal. */
  fenetre?: "minute" | "jour";
};

const AUTORISE: Verdict = { autorise: true, attente: 0 };

/**
 * Repli en mémoire, **pour le développement seulement**.
 *
 * Il ne protège pas en production et ne prétend pas le faire : sur une
 * plateforme sans serveur, chaque instance a sa propre mémoire et elles sont
 * éphémères. Un attaquant qui frappe assez vite parle à autant de compteurs
 * qu'il y a d'instances. C'est la raison d'être d'Upstash — un compteur
 * partagé — et non un luxe.
 */
const memoire = new Map<string, number[]>();

function limiteEnMemoire(cle: string, max: number, fenetreMs: number): Verdict {
  const maintenant = Date.now();
  const vus = (memoire.get(cle) ?? []).filter((t) => maintenant - t < fenetreMs);
  if (vus.length >= max) {
    const plusVieux = Math.min(...vus);
    return {
      autorise: false,
      attente: Math.ceil((fenetreMs - (maintenant - plusVieux)) / 1000),
    };
  }
  vus.push(maintenant);
  memoire.set(cle, vus);
  // Le tableau ne grandit pas indéfiniment : on l'élague à chaque passage, et
  // on oublie les clés inactives pour ne pas fuir en mémoire sur un long run.
  if (memoire.size > 5000) {
    for (const [k, v] of memoire) {
      if (v.every((t) => maintenant - t > fenetreMs)) memoire.delete(k);
    }
  }
  return AUTORISE;
}

/** Prêt seulement si les deux variables sont là : une seule ne sert à rien. */
const upstashConfigure = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const limiteurs = upstashConfigure
  ? (() => {
      const redis = Redis.fromEnv();
      return {
        minute: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(PAR_MINUTE, "60 s"),
          prefix: "ama:chat:min",
          // Le compteur est mis à jour après la réponse : la requête n'attend
          // pas l'aller-retour Redis pour partir vers le modèle.
          analytics: false,
        }),
        jour: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(PAR_JOUR, "1 d"),
          prefix: "ama:chat:jour",
          analytics: false,
        }),
      };
    })()
  : null;

/**
 * L'adresse du visiteur.
 *
 * `x-forwarded-for` peut porter toute une chaîne de mandataires ; **seule la
 * première entrée** est celle du client, les suivantes sont ajoutées en route
 * et se falsifient. Sur Vercel, l'en-tête est réécrit par la plateforme, donc
 * digne de foi.
 */
export function adresseDe(requete: Request): string {
  const chaine = requete.headers.get("x-forwarded-for");
  if (chaine) return chaine.split(",")[0].trim();
  return requete.headers.get("x-real-ip")?.trim() || "inconnue";
}

export async function verifieLaLimite(ip: string): Promise<Verdict> {
  if (!limiteurs) {
    const parMinute = limiteEnMemoire(`min:${ip}`, PAR_MINUTE, 60_000);
    if (!parMinute.autorise) return { ...parMinute, fenetre: "minute" };
    const parJour = limiteEnMemoire(`jour:${ip}`, PAR_JOUR, 86_400_000);
    if (!parJour.autorise) return { ...parJour, fenetre: "jour" };
    return AUTORISE;
  }

  const minute = await limiteurs.minute.limit(ip);
  if (!minute.success) {
    return {
      autorise: false,
      attente: Math.max(1, Math.ceil((minute.reset - Date.now()) / 1000)),
      fenetre: "minute",
    };
  }
  const jour = await limiteurs.jour.limit(ip);
  if (!jour.success) {
    return {
      autorise: false,
      attente: Math.max(1, Math.ceil((jour.reset - Date.now()) / 1000)),
      fenetre: "jour",
    };
  }
  return AUTORISE;
}

/** Pour le journal de démarrage et les tests : dit ce qui protège réellement. */
export const protectionPartagee = upstashConfigure;
export const limites = { parMinute: PAR_MINUTE, parJour: PAR_JOUR };
