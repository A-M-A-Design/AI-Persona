// Dictionnaire i18n maison (client-safe — aucun accès fs).
export type Lang = "fr" | "en";

const STRINGS = {
  fr: {
    heroTitle: "Bonjour, je suis Arthur !",
    heroSubtitle: "Designaut passionné de Design System, Product et Operations",
    askAnything: "Posez-moi n'importe quelle question !",
    letsChat: "Discutons",
    readArticle: "Lire l'article",
    chatTitle: "Arthur Mathon",
    closeChat: "Fermer la conversation",
    newChat: "Démarrer une nouvelle conversation",
    letsConnect: "Restons en contact !",
    connectText:
      "N'hésitez pas à me contacter sur les réseaux ou à m'envoyer un e-mail.",
    mail: "E-mail",
    error: "Oups, quelque chose a coincé. Réessayez dans un instant.",
    thinking: "Réponse en cours…",
    suggestions: "Questions suggérées",
    moreQuestions: "Voir plus de questions",
    moreArticles: "Autres articles",
    previousArticles: "Articles précédents",
    nextArticles: "Articles suivants",
    avatarType: "Type d'avatar",
    language: "Langue",
    colorMode: "Mode couleur",
    optionOurs: "Ours",
    optionCorneille: "Corneille",
    optionLibellule: "Libellule",
    optionLight: "Clair",
    optionDark: "Sombre",
    goBack: "Retour",
    backToHome: "Retour à l'accueil",
    articleFrenchOnly: "Cet article est publié en français.",
    footerLinkedIn: "LinkedIn",
  },
  en: {
    heroTitle: "Hi, I'm Arthur!",
    heroSubtitle: "A Designaut passionate of Design System, Product and Operations",
    askAnything: "Ask me anything!",
    letsChat: "Let's chat",
    readArticle: "Read the article",
    chatTitle: "Arthur Mathon",
    closeChat: "Close the conversation",
    newChat: "Start a new conversation",
    letsConnect: "Let's connect!",
    connectText:
      "Feel free to contact me on social media or send me an email.",
    mail: "Mail",
    error: "Oops, something went wrong. Please try again.",
    thinking: "Thinking…",
    suggestions: "Suggested questions",
    moreQuestions: "See more questions",
    moreArticles: "More articles",
    previousArticles: "Previous articles",
    nextArticles: "Next articles",
    avatarType: "Avatar Type",
    language: "Language",
    colorMode: "Color Mode",
    optionOurs: "Bear",
    optionCorneille: "Crow",
    optionLibellule: "Dragonfly",
    optionLight: "Light",
    optionDark: "Dark",
    goBack: "Go back",
    backToHome: "Back to home",
    articleFrenchOnly: "This article is published in French.",
    footerLinkedIn: "LinkedIn",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["fr"];

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[lang][key];
}
