// Dictionnaire i18n maison (client-safe — aucun accès fs).
export type Lang = "fr" | "en";

const STRINGS = {
  fr: {
    subtitle: "Design System Lead · Product · Ops — discutez avec ma version IA",
    welcome:
      "Bonjour ! Je suis la version IA d'Arthur. Posez-moi vos questions sur son parcours, ses projets ou sa façon de travailler.",
    placeholder: "Posez votre question…",
    send: "Envoyer",
    error: "Oups, quelque chose a coincé. Réessayez dans un instant.",
    thinking: "Réponse en cours…",
    suggestions: "Questions suggérées",
    newChat: "Nouvelle conversation",
    avatarType: "Type d'avatar",
    language: "Langue",
    colorMode: "Mode couleur",
    optionOurs: "Ours",
    optionCorneille: "Corneille",
    optionLibellule: "Libellule",
    optionLight: "Clair",
    optionDark: "Sombre",
    articlesTitle: "Articles",
    readOnLinkedIn: "Lire sur LinkedIn",
    comingSoon: "Nouvelle version — bientôt en ligne",
    footerLinkedIn: "LinkedIn",
    footerEmail: "Écrire à Arthur",
  },
  en: {
    subtitle: "Design System Lead · Product · Ops — chat with my AI self",
    welcome:
      "Hi! I'm Arthur's AI self. Ask me anything about his background, projects or the way he works.",
    placeholder: "Ask your question…",
    send: "Send",
    error: "Oops, something went wrong. Please try again.",
    thinking: "Thinking…",
    suggestions: "Suggested questions",
    newChat: "New conversation",
    avatarType: "Avatar Type",
    language: "Language",
    colorMode: "Color Mode",
    optionOurs: "Bear",
    optionCorneille: "Crow",
    optionLibellule: "Dragonfly",
    optionLight: "Light",
    optionDark: "Dark",
    articlesTitle: "Articles",
    readOnLinkedIn: "Read on LinkedIn",
    comingSoon: "New version — coming soon",
    footerLinkedIn: "LinkedIn",
    footerEmail: "Email Arthur",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["fr"];

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[lang][key];
}
