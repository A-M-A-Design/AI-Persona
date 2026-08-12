// Dictionnaire i18n maison (client-safe — aucun accès fs).
export type Lang = "fr" | "en";

const STRINGS = {
  fr: {
    heroTitle: "Bonjour, je suis Arthur !",
    heroSubtitle: "Designaute passionné de Design System, Product et Operations",
    askAnything: "Posez-moi n'importe quelle question !",
    // Nom accessible du champ, distinct de son indice de saisie : le
    // placeholder disparaît dès la première frappe, le libellé demeure.
    questionLabel: "Votre question",
    letsChat: "Discutons",
    readArticle: "Lire l'article",
    chatTitle: "Arthur Mathon",
    closeChat: "Fermer la conversation",
    newChat: "Démarrer une nouvelle conversation",
    mail: "E-mail",
    error: "Oups, quelque chose a coincé. Réessayez dans un instant.",
    thinking: "Réponse en cours…",
    suggestions: "Questions suggérées",
    moreQuestions: "Voir plus de questions",
    switchToPersona: "Basculer vers {name}",
    carousel: "carrousel",
    slide: "slide",
    personaCarousel: "Choisir un persona",
    slideshowTrack: "Faire défiler les personas",
    slidePosition: "{n} sur {total}",
    personaActive: "Persona actif : {name}",
    playSlideshow: "Lancer le défilement automatique",
    pauseSlideshow: "Mettre en pause le défilement automatique",
    previousPersona: "Persona précédent",
    nextPersona: "Persona suivant",
    featuredArticles: "Articles à la une",
    moreArticles: "Autres articles",
    previousArticles: "Articles précédents",
    nextArticles: "Articles suivants",
    pageCounter: "Page {n} sur {total}",
    skipToContent: "Aller au contenu",
    avatarType: "Type d'avatar",
    language: "Langue",
    colorMode: "Mode couleur",
    optionOurs: "Ours",
    optionCorneille: "Corneille",
    optionLibellule: "Libellule",
    optionLight: "Clair",
    optionDark: "Sombre",
    backToHome: "Retour à l'accueil",
    articleFrenchOnly: "Cet article est publié en français.",
    footerLinkedIn: "LinkedIn",
  },
  en: {
    heroTitle: "Hi, I'm Arthur!",
    heroSubtitle: "A Designaut passionate of Design System, Product and Operations",
    askAnything: "Ask me anything!",
    questionLabel: "Your question",
    letsChat: "Let's chat",
    readArticle: "Read the article",
    chatTitle: "Arthur Mathon",
    closeChat: "Close the conversation",
    newChat: "Start a new conversation",
    mail: "Mail",
    error: "Oops, something went wrong. Please try again.",
    thinking: "Thinking…",
    suggestions: "Suggested questions",
    moreQuestions: "See more questions",
    switchToPersona: "Switch to {name}",
    carousel: "carousel",
    slide: "slide",
    personaCarousel: "Choose a persona",
    slideshowTrack: "Scroll through the personas",
    slidePosition: "{n} of {total}",
    personaActive: "Active persona: {name}",
    playSlideshow: "Start the automatic slideshow",
    pauseSlideshow: "Pause the automatic slideshow",
    previousPersona: "Previous persona",
    nextPersona: "Next persona",
    featuredArticles: "Featured articles",
    moreArticles: "More articles",
    previousArticles: "Previous articles",
    nextArticles: "Next articles",
    pageCounter: "Page {n} of {total}",
    skipToContent: "Skip to content",
    avatarType: "Avatar Type",
    language: "Language",
    colorMode: "Color Mode",
    optionOurs: "Bear",
    optionCorneille: "Crow",
    optionLibellule: "Dragonfly",
    optionLight: "Light",
    optionDark: "Dark",
    backToHome: "Back to home",
    articleFrenchOnly: "This article is published in French.",
    footerLinkedIn: "LinkedIn",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["fr"];

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[lang][key];
}

/**
 * Variante interpolée : `tf(lang, "pageCounter", { n: 2, total: 5 })` rend
 * « Page 2 sur 5 ». La position des valeurs change d'une langue à l'autre, une
 * concaténation dans le composant ne suffirait donc pas.
 */
export function tf(
  lang: Lang,
  key: StringKey,
  values: Record<string, string | number>,
): string {
  return t(lang, key).replace(/\{(\w+)\}/g, (found, name: string) =>
    name in values ? String(values[name]) : found,
  );
}
