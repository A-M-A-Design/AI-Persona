import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { buildInstructions, resolveProvider } from "@/lib/model";
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
    model: provider.model,
    instructions: buildInstructions(provider, prompt),
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 1500,
    onError: ({ error }) => {
      console.error("[/api/chat]", error);
    },
  });

  return result.toUIMessageStreamResponse();
}
