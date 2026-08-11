// Dictionnaire i18n maison (client-safe — aucun accès fs).
export type Lang = "fr" | "en";

const STRINGS = {
  fr: {
    heroTitle: "Bonjour, je suis Arthur !",
    heroSubtitle: "Designaut passionné de Design System, Product et Operations",
    askAnything: "Posez-moi n'importe quelle question !",
    letsChat: "Discutons",
    readArticle: "Lire l'article",
    letsConnect: "Restons en contact !",
    connectText:
      "N'hésitez pas à me contacter sur les réseaux ou à m'envoyer un e-mail.",
    mail: "E-mail",
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
    heroTitle: "Hi, I'm Arthur!",
    heroSubtitle: "A Designaut passionate of Design System, Product and Operations",
    askAnything: "Ask me anything!",
    letsChat: "Let's chat",
    readArticle: "Read the article",
    letsConnect: "Let's connect!",
    connectText:
      "Feel free to contact me on social media or send me an email.",
    mail: "Mail",
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
