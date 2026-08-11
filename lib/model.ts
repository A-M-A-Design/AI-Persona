// Sélection du provider de chat. La route ne connaît ni le SDK du provider,
// ni le nom de sa variable de clé, ni sa capacité de cache : elle demande un
// modèle et des instructions déjà annotées.
//
// Deux providers pour deux usages :
//   - mistral   (défaut) tier Experiment gratuit, ~1 Md tokens/mois
//   - anthropic qualité de référence, seul à savoir cacher le prefix stable
import { anthropic } from "@ai-sdk/anthropic";
import { mistral } from "@ai-sdk/mistral";
import type { LanguageModel } from "ai";

export type ProviderId = "mistral" | "anthropic";

const DEFAULT_PROVIDER: ProviderId = "mistral";

type ProviderSpec = {
  /** Variable d'environnement portant la clé API. */
  envKey: string;
  /** Modèle utilisé si CHAT_MODEL est absent. */
  defaultModel: string;
  /**
   * true si le provider sait mettre en cache le prefix stable du prompt.
   * Mistral n'expose pas de breakpoint de cache : les ~22k tokens de la base
   * de connaissance repartent en entier à chaque requête. Sur le tier gratuit
   * c'est une question de quota, pas de coût.
   */
  promptCaching: boolean;
  model: (id: string) => LanguageModel;
};

const PROVIDERS: Record<ProviderId, ProviderSpec> = {
  mistral: {
    envKey: "MISTRAL_API_KEY",
    defaultModel: "mistral-medium-latest",
    promptCaching: false,
    model: (id) => mistral(id),
  },
  anthropic: {
    envKey: "ANTHROPIC_API_KEY",
    defaultModel: "claude-haiku-4-5",
    promptCaching: true,
    model: (id) => anthropic(id),
  },
};

export function isProviderId(value: unknown): value is ProviderId {
  return value === "mistral" || value === "anthropic";
}

// CHAT_MODEL est relatif au provider actif. Sans garde-fou, un CHAT_MODEL
// hérité d'un autre provider part tel quel et l'API répond un 400 opaque.
// On ne rejette que le cas franchement faux ; un ID inconnu passe, pour ne
// pas bloquer sur un modèle sorti après ce code.
const MISTRAL_PREFIXES = ["mistral-", "ministral-", "magistral-", "pixtral-", "codestral-", "open-"];

function foreignModel(id: ProviderId, modelId: string): string | null {
  const isClaude = modelId.startsWith("claude-");
  const isMistral = MISTRAL_PREFIXES.some((p) => modelId.startsWith(p));

  if (id === "mistral" && isClaude) {
    return `CHAT_MODEL="${modelId}" est un modèle Anthropic mais CHAT_PROVIDER=mistral.`;
  }
  if (id === "anthropic" && isMistral) {
    return `CHAT_MODEL="${modelId}" est un modèle Mistral mais CHAT_PROVIDER=anthropic.`;
  }
  return null;
}

export type ResolvedProvider = {
  id: ProviderId;
  modelId: string;
  model: LanguageModel;
  promptCaching: boolean;
  /** null si la clé est présente, sinon le message d'erreur à renvoyer. */
  missingKey: string | null;
};

export function resolveProvider(): ResolvedProvider {
  const raw = process.env.CHAT_PROVIDER;
  if (raw !== undefined && !isProviderId(raw)) {
    throw new Error(
      `CHAT_PROVIDER invalide : "${raw}". Valeurs acceptées : mistral, anthropic.`,
    );
  }
  const id = raw ?? DEFAULT_PROVIDER;
  const spec = PROVIDERS[id];
  const modelId = process.env.CHAT_MODEL ?? spec.defaultModel;

  const mismatch = foreignModel(id, modelId);
  if (mismatch) {
    throw new Error(
      `${mismatch} Adapter CHAT_MODEL, le retirer pour prendre le défaut (${spec.defaultModel}), ou changer CHAT_PROVIDER.`,
    );
  }

  return {
    id,
    modelId,
    model: spec.model(modelId),
    promptCaching: spec.promptCaching,
    missingKey: process.env[spec.envKey]
      ? null
      : `${spec.envKey} manquante — copier .env.example en .env.local (CHAT_PROVIDER=${id})`,
  };
}

// Le prompt arrive en deux morceaux (cf. lib/prompt.ts) : un prefix stable
// (identité + garde-fous + KB) et une partie variable (persona + langue).
// Chez Anthropic le prefix porte un breakpoint de cache ; ailleurs les deux
// morceaux sont de simples messages system.
export function buildInstructions(
  provider: ResolvedProvider,
  prompt: { stable: string; variable: string },
) {
  return [
    {
      role: "system" as const,
      content: prompt.stable,
      ...(provider.promptCaching
        ? {
            providerOptions: {
              anthropic: { cacheControl: { type: "ephemeral" as const } },
            },
          }
        : {}),
    },
    { role: "system" as const, content: prompt.variable },
  ];
}
