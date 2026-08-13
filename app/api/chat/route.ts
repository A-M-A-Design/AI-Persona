import { convertToModelMessages, jsonSchema, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { readArticlePlainText } from "@/lib/article-body";
import { ARTICLES } from "@/lib/articles";
import { detectLang } from "@/lib/detect-lang";
import { buildInstructions, resolveProvider } from "@/lib/model";
import { isPersonaId } from "@/lib/personas";
import { adresseDe, verifieLaLimite } from "@/lib/rate-limit";
import { buildSystemPrompt } from "@/lib/prompt";

export const maxDuration = 60;

const MAX_HISTORY = 30;
const MAX_MESSAGE_CHARS = 2000;

const SLUGS = ARTICLES.map((a) => a.slug);

/**
 * Le prompt ne porte que la synthèse des articles (cf. lib/prompt.ts) : leur
 * texte intégral pesait plus que tout le reste de la base réuni, pour un
 * contenu que la plupart des conversations n'abordent jamais. Il se charge
 * donc ici, à la demande, quand la question porte vraiment sur un article.
 *
 * Le slug est contraint par le schéma ET revérifié à l'exécution : un modèle
 * qui invente un slug reçoit la liste des articles réels, jamais du vide qu'il
 * pourrait combler de lui-même.
 */
const lireArticle = tool({
  description:
    "Renvoie le texte intégral d'un article publié sur ce site. À appeler avant de " +
    "discuter le contenu d'un article au-delà de la synthèse figurant dans <articles>.",
  inputSchema: jsonSchema<{ slug: string }>({
    type: "object",
    properties: {
      slug: {
        type: "string",
        enum: SLUGS,
        description: "Identifiant de l'article, tel qu'indiqué dans <articles>.",
      },
    },
    required: ["slug"],
    additionalProperties: false,
  }),
  execute: async ({ slug }) => {
    if (!SLUGS.includes(slug)) {
      return {
        erreur: `Aucun article ne porte le slug « ${slug} ». Articles disponibles : ${SLUGS.join(", ")}.`,
      };
    }
    const texte = readArticlePlainText(slug);
    return texte ? { slug, texte } : { erreur: `Le corps de l'article « ${slug} » est introuvable.` };
  },
});

function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

export async function POST(req: Request) {
  /*
    La limite de débit passe **avant tout le reste** : avant de lire le corps,
    avant de résoudre le provider. Une requête refusée ne doit rien coûter — ni
    un appel au modèle, ni la lecture d'un article depuis le disque.
  */
  const ip = adresseDe(req);
  const verdict = await verifieLaLimite(ip);
  if (!verdict.autorise) {
    console.warn(`[/api/chat] limite ${verdict.fenetre} atteinte pour ${ip}`);
    return Response.json(
      { error: "rate_limited", fenetre: verdict.fenetre, retryAfter: verdict.attente },
      {
        status: 429,
        // `Retry-After` est la façon normalisée de dire « reviens dans N
        // secondes ». Les clients corrects s'en servent, et cela évite qu'un
        // script bien intentionné ne martèle la route.
        headers: { "Retry-After": String(verdict.attente) },
      },
    );
  }

  let provider;
  try {
    provider = resolveProvider();
  } catch (error) {
    console.error("[/api/chat]", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
  if (provider.missingKey) {
    return Response.json({ error: provider.missingKey }, { status: 500 });
  }

  let payload: { messages?: UIMessage[]; persona?: unknown; lang?: unknown };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    return Response.json({ error: "messages manquants" }, { status: 400 });
  }
  const messages = payload.messages.slice(-MAX_HISTORY);

  const last = messages[messages.length - 1];
  const lastText = last.role === "user" ? messageText(last) : "";
  if (lastText.length > MAX_MESSAGE_CHARS) {
    return Response.json(
      { error: `Message trop long (max ${MAX_MESSAGE_CHARS} caractères)` },
      { status: 400 },
    );
  }

  const persona = isPersonaId(payload.persona) ? payload.persona : "ours";
  // La langue de réponse se déduit du message posé, pas du réglage d'interface :
  // un visiteur peut écrire en anglais sur une interface en français. Le réglage
  // ne sert que de repli quand le message ne porte pas assez de signal.
  const uiLang = payload.lang === "en" ? "en" : "fr";
  const lang = detectLang(lastText) ?? uiLang;

  const prompt = buildSystemPrompt({ persona, lang });
  const result = streamText({
    model: provider.model,
    instructions: buildInstructions(provider, prompt),
    messages: await convertToModelMessages(messages),
    tools: { lire_article: lireArticle },
    // Sans palier d'arrêt, le modèle s'arrête sur l'appel d'outil et le
    // visiteur ne voit jamais la réponse. Trois étapes suffisent : appel,
    // résultat, rédaction — et bornent le coût si le modèle boucle.
    stopWhen: stepCountIs(3),
    maxOutputTokens: 1500,
    onError: ({ error }) => {
      console.error("[/api/chat]", error);
    },
  });

  return result.toUIMessageStreamResponse();
}
