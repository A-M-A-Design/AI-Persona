import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { isPersonaId } from "@/lib/personas";
import { buildSystemPrompt } from "@/lib/prompt";

export const maxDuration = 60;

const MAX_HISTORY = 30;
const MAX_MESSAGE_CHARS = 2000;

function textLength(message: UIMessage): number {
  return message.parts.reduce(
    (len, part) => (part.type === "text" ? len + part.text.length : len),
    0,
  );
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY manquante — copier .env.example en .env.local" },
      { status: 500 },
    );
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
  if (last.role === "user" && textLength(last) > MAX_MESSAGE_CHARS) {
    return Response.json(
      { error: `Message trop long (max ${MAX_MESSAGE_CHARS} caractères)` },
      { status: 400 },
    );
  }

  const persona = isPersonaId(payload.persona) ? payload.persona : "ours";
  const lang = payload.lang === "en" ? "en" : "fr";

  const prompt = buildSystemPrompt({ persona, lang });
  const result = streamText({
    model: anthropic(process.env.CHAT_MODEL ?? "claude-opus-5"),
    instructions: [
      {
        role: "system",
        content: prompt.stable,
        // Breakpoint de prompt caching : la KB (le gros du prompt) est mise en
        // cache côté Anthropic et partagée entre les combinaisons persona×langue.
        providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
      },
      { role: "system", content: prompt.variable },
    ],
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 1500,
    onError: ({ error }) => {
      console.error("[/api/chat]", error);
    },
  });

  return result.toUIMessageStreamResponse();
}
