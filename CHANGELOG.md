# Changelog

Toutes les évolutions notables de ce projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
versionnage suit [SemVer](https://semver.org/lang/fr/) :
`0.1.0` → M1 (chat) … `0.5.0` → POC complet, `1.0.0` → MVP public.

## [Unreleased]

### Added

- **Interface refondue d'après la maquette Figma** : header à chips alignés à
  droite (avatar, langue) et toggle clair/sombre ; héro avec titre, sous-titre
  et barre de chat posée en débord sur l'illustration du persona ; deux grilles
  d'articles en cards-image (deux grandes carrées, puis des cards étroites
  partageant la rangée avec la carte contact). Le footer disparaît, remplacé
  par cette carte contact.
- La conversation s'ouvre dans un **panneau modal** (`ChatModal`) : 640 px
  centré sur un scrim en desktop, plein écran en tablette et mobile. Le fil
  s'ancre en bas, la question posée est une pastille sombre et la réponse du
  texte simple. Échap et clic sur le scrim ferment, le focus est piégé dans le
  panneau puis rendu à l'élément d'origine, et la page ne défile plus derrière.
- Les questions suggérées **se consomment** : une question déjà posée
  disparaît des chips, dans le héro comme dans le panneau.
- `npm run a11y:contrast` : audit WCAG AA des thèmes générés (3 personas × 2
  modes × 10 paires texte/fond), qui évalue les deux extrémités des dégradés et
  compose les fonds semi-transparents sur la surface. Sortie 1 en cas d'échec.
- **Titres et surtitres d'articles bilingues** : `title` et `kicker` passent en
  `Record<Lang, string>` et suivent la bascule FR/EN, comme le reste de l'UI.
- Transition d'ouverture et de fermeture du panneau de conversation (fondu du
  scrim, fondu + glissement du panneau, `ease-in-out`), neutralisée sous
  `prefers-reduced-motion`.
- **Visuels exportés de la maquette** : 3 illustrations de héro (`public/hero/`)
  et 4 visuels d'articles (`public/articles/`). Servis par `next/image`, qui
  les convertit en WebP à la volée — le héro tombe de 1,64 Mo à 88 Ko.

- **Choix du provider de chat** (`lib/model.ts`) : `CHAT_PROVIDER` sélectionne
  `mistral` (défaut) ou `anthropic`. La route `/api/chat` ne connaît plus ni le
  SDK du provider, ni le nom de sa variable de clé, ni sa capacité de cache.
  Motif : le tier Experiment de Mistral est gratuit (~1 Md tokens/mois), ce qui
  permet de déployer le portfolio sans coût récurrent.
- Garde-fou de configuration : un `CHAT_MODEL` appartenant visiblement à l'autre
  provider (`claude-*` avec `CHAT_PROVIDER=mistral`, et réciproquement) échoue
  avec un message explicite au lieu d'un 400 opaque de l'API. Un identifiant
  inconnu passe, pour ne pas bloquer sur un modèle plus récent que ce code.

- `sessions-summary/` : un résumé versionné par session de travail
  (décisions, livraisons, incidents, reste à faire) — documentation du
  processus de fabrication du projet.

- **Héro illustré + selects + articles + footer** : illustration héro façon
  La Linea (un trait continu par avatar, couleur primaire du thème actif —
  change avec l'avatar sélectionné, comme poulos.co) ; les 3 contrôles
  deviennent des selects WDS sans emoji (« Avatar Type », « Language »,
  « Color Mode ») ; bloc « Articles » sous le chat (une card WDS par article,
  liens LinkedIn) ; footer avec liens LinkedIn et e-mail. L'avatar du chat
  reprend le glyphe La Linea.

### Fixed

- **Texte des cards article illisible en mode sombre.** Il consommait
  `on-primary`, qui s'inverse d'un mode à l'autre : en sombre le libellé
  devenait quasi noir sur un voile noir (`#0f0800` pour l'ours). Les liaisons de
  la maquette sont `on-surface-hi` pour le titre et `on-surface-low` pour le
  surtitre ; le contenu de la card force désormais le mode sombre localement
  (`data-persona` + `data-color-mode` sur `.article-card__body`), puisqu'il
  repose toujours sur un voile foncé quel que soit le mode de la page — c'est
  ce que fait la maquette, où le titre vaut `#f7f9fb` en clair comme en sombre.
- Voile du bloc de texte des cards porté de 54 % à 60 % : à 54 % le titre
  tombait à 4,15:1 sur une image claire. Le surtitre prend `on-surface-hi` au
  lieu de `on-surface-low` (2,21:1) — `on-surface-mid` ne monte qu'à 3,18:1, et
  atteindre AA avec `low` demanderait un voile à 80 %. La hiérarchie reste
  portée par la taille, l'italique et les capitales.

- **L'état inactif des boutons garde son libellé lisible.** Le WDS efface le
  bouton entier (opacité 0,38 sur le fond *et* le libellé), soit 1,25:1. Le
  libellé reste désormais pleinement opaque et c'est le fond qui devient
  translucide — 24 % de la primaire, laissant transparaître l'arrière-plan :
  8,88 à 9,78:1 selon les combinaisons, sans que le bouton cesse de se lire
  comme inactif. `pointer-events: none` est réaffirmé, donc aucune interaction
  au survol.

- **Contraste insuffisant sur les boutons de certains thèmes.** La
  transformation de teinte conservait la *clarté HSL*, pas la *luminance
  relative WCAG* — deux grandeurs différentes, le vert pesant 0,7152 dans la
  seconde contre 0,0722 pour le bleu. Une rotation bleu → cyan éclaircissait
  donc la couleur à clarté constante. Deux paires tombaient sous AA en
  libellule clair : bouton primaire à 4,24:1 (extrémité claire de son dégradé)
  et lien à 2,97:1. Chaque couleur transformée est désormais ramenée à la
  luminance de l'originale, ce qui préserve tous les ratios par construction ;
  les mêmes paires montent à 7,15:1 et 7,45:1.

- **Le fil de conversation ne défilait pas** quand il dépassait la hauteur du
  panneau : `justify-content: flex-end` sur un conteneur en `overflow: auto`
  fait déborder le contenu au-dessus de la zone scrollable, hors d'atteinte de
  la barre de défilement. L'ancrage en bas passe désormais par une marge
  automatique sur le premier enfant.

### Changed

- **La typographie responsive passe par les tokens WDS.** Les tailles de la
  maquette (titre 62/48/38 px, radius 6 px) sont exactement les valeurs de
  `--wel-sem-font-sizes-display-2xl` et `--wel-sem-border-radius-container-low`
  selon les breakpoints du thème : aucune media query de texte n'est écrite,
  seules les grilles et les marges en ont.
- `lib/articles.ts` porte désormais un surtitre et un visuel par article ;
  `ArticlesSection` rend les deux grilles de la maquette.

### Removed

- `SiteFooter`, `HeaderSubtitle`, `HeroIllustration` et `MessageBubble` : la
  maquette ne les utilise plus. Le panneau de conversation n'affiche pas
  d'avatar, `PersonaGlyph` n'est donc plus référencé (conservé sur demande).
- Clés i18n devenues sans emploi : `subtitle`, `welcome`, `placeholder`,
  `send`, `newChat`, `articlesTitle`, `readOnLinkedIn`, `footerEmail`.

- **Le prompt caching devient spécifique à Anthropic.** Le provider Mistral
  n'expose aucun breakpoint de cache : sous `CHAT_PROVIDER=mistral`, les
  ~22 000 tokens du prefix stable (identité + garde-fous + base de
  connaissance) repartent en entier à chaque requête. Sur le tier gratuit
  c'est du quota, pas du coût — environ 45 000 requêtes par mois. Le
  breakpoint `cacheControl` n'est plus posé que sur le chemin Anthropic.
- `.env.example` documente les deux providers ; `CHAT_MODEL` est désormais
  relatif au `CHAT_PROVIDER` actif.

- Article « entreprise traumatisée » remplacé par la **v2 enrichie** (docx),
  nettoyée des notes de travail et annotations de relecture — dans la base de
  connaissance et le bloc Articles.
- La page devient scrollable (héro → chat à hauteur fixe → articles → footer) ;
  suppression des anciens toggles chips au profit de la SettingsBar.

- **i18n FR/EN (M4)** : dictionnaire maison typé (`lib/i18n.ts`), `LangToggle`
  (UI + `<html lang>` + langue du bot au message suivant), hook partagé
  `useSettings` (persona/langue/mode synchronisés entre tous les composants via
  un événement), sous-titre et libellés localisés. Les modulateurs de
  personnalité et questions suggérées FR/EN étaient en place depuis M1.

- **Theming des 3 personas (M3)** : `scripts/build-themes.mjs` génère un thème
  complet par persona depuis le template WDS — transformation des couleurs par
  règles de teinte HSL (luminance préservée → contrastes light/dark intacts,
  teintes sémantiques rouge/vert/jaune conservées), remplacement des familles
  de polices, overrides de variables, rescope `[data-persona]` ×
  `[data-color-mode]` (6 combinaisons).
- Fonts par persona via `next/font` : Fraunces + Nunito Sans (Ours),
  Cormorant Garamond + Work Sans (Corneille), Press Start 2P + VT323
  (Libellule).
- `PersonaSwitcher` (radiogroup) sur l'accueil et `/dev/kit` ; le chat suit le
  persona actif en direct (questions suggérées, avatar, voix au prochain
  message).
- Libellule rétro/16-bit via le contrat : radius 0, ombres dures sans flou,
  corps de texte agrandi ; extras hors contrat minimes (`persona-extras.css` :
  pixelated, bordures 2px).
- Règle tokens documentée : le CSS applicatif ne consomme que `--wel-sem-*` /
  `--wel-comp-*` (jamais prim/bsem/bcomp).

- **Base de connaissance réelle (M2)** : bio, expertise, philosophie, façon de
  travailler, FAQ et tone of voice curés depuis l'export Notion, le profil
  LinkedIn (PDF) et les articles ; 6 fiches projets (Accor WDS, Jems ×2,
  SIAAP, Gaumont, AI Persona) ; 5 articles complets dans `content-library/`.
- **Prompt caching Anthropic** : la partie stable du system prompt (KB) porte
  un breakpoint `cacheControl` — ~90 % d'économie d'input dès la 2e requête,
  partagée entre les 6 combinaisons persona×langue.
- `docs/eval-questions.md` : 20 golden questions (faits, pièges, ton, langues)
  et `docs/test-plan.md` : checklists de validation par milestone.

### Changed

- Modèle du chat par défaut du projet : `claude-haiku-4-5` (maîtrise des
  coûts, choix utilisateur) — configurable via `CHAT_MODEL`.

- **Chat streaming (M1)** : route `/api/chat` (Vercel AI SDK v7 → Anthropic,
  modèle configurable via `CHAT_MODEL`), UI de chat complète (bulles WDS,
  composer, questions suggérées, skeleton, erreurs), bornes serveur
  (message ≤ 2000 caractères, historique ≤ 30 messages, sortie ≤ 1500 tokens).
- Assemblage du system prompt (`lib/prompt.ts`) : identité + garde-fous
  (ancrage factuel strict, rôle, confidentialité) + base de connaissance
  balisée + modulateur de persona + langue — ordre pensé pour le prompt caching.
- Définition des 3 personas (`personas/*.json`) : modulateur de ton et
  questions suggérées FR/EN pour Ours 🐻, Corneille 🐦‍⬛, Libellule ✨.
- `knowledge/` : structure de la base de connaissance (bio placeholder,
  `_meta.md` avec les règles d'édition).
- Page `/dev/kit` : audit visuel des composants WDS (l'accueil devient le chat).

### Socle M0

- Socle Next.js 16 (App Router, TypeScript) sans Tailwind — le styling repose
  entièrement sur le contrat de variables `--wel-*`.
- `scripts/install-welds.mjs` : extraction locale des assets WDS (thème
  brandbook + 12 composants CSS) vers `styles/welds-src/`, dossier **gitignoré**
  — l'IP Accor n'entre jamais dans l'historique git.
- Page démo M0 : boutons, champ de saisie, messages et chips WDS.
- Toggle light/dark via l'attribut `data-color-mode` (natif au thème WDS),
  persisté en localStorage avec script anti-flash.
- Config `outputFileTracingIncludes` pour embarquer la future base de
  connaissance dans les functions Vercel.
- Docs du socle : README (setup Windows), `.env.example`, template de PR
  imposant la règle d'or (branche dédiée + CHANGELOG + tests).
