# Changelog

Toutes les évolutions notables de ce projet sont documentées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
versionnage suit [SemVer](https://semver.org/lang/fr/) :
`0.1.0` → M1 (chat) … `0.5.0` → POC complet, `1.0.0` → MVP public.

## [Unreleased]

### Added

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
