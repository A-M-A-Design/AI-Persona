# Changelog

Toutes les évolutions notables de ce projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
versionnage suit [SemVer](https://semver.org/lang/fr/) :
`0.1.0` → M1 (chat) … `0.5.0` → POC complet, `1.0.0` → MVP public.

## [Unreleased]

### Added

- **Héro illustré + selects + articles + footer** : illustration héro façon
  La Linea (un trait continu par avatar, couleur primaire du thème actif —
  change avec l'avatar sélectionné, comme poulos.co) ; les 3 contrôles
  deviennent des selects WDS sans emoji (« Avatar Type », « Language »,
  « Color Mode ») ; bloc « Articles » sous le chat (une card WDS par article,
  liens LinkedIn) ; footer avec liens LinkedIn et e-mail. L'avatar du chat
  reprend le glyphe La Linea.

### Changed

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
