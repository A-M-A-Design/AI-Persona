# AI Persona — Arthur Mathon

Portfolio conversationnel : un recruteur ouvre une URL et discute avec la
**version IA d'Arthur** (Design System Lead/Product/Ops) pour découvrir son
parcours, ses projets et sa façon de travailler. Trois personas switchables —
🐻 Ours (chaleureux, défaut), 🐦‍⬛ Corneille (mystérieux), ✨ Libellule
(rétro 16-bit) — en light/dark et FR/EN.

L'interface est elle-même une démo de compétence design system : chaque persona
est un thème complet respectant un contrat de ~870 variables CSS (`--wel-*`),
sur le modèle du theming multi-marques d'Accor.

## Prérequis (Windows)

- Node ≥ 20 (`node --version`)
- Le zip `welds-mcp-v3.zip` à la racine du projet (assets WDS — **non commité**)
- Une clé API Anthropic ([console.anthropic.com](https://console.anthropic.com))

## Setup

```powershell
npm install
npm run welds:install        # extrait les assets WDS vers styles/welds-src/ (gitignoré)
Copy-Item .env.example .env.local   # puis renseigner ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `start` | Build et serveur de prod |
| `npm run check` | Vérification TypeScript (`tsc --noEmit`) |
| `npm run welds:install` | Extraction des assets WDS depuis le zip |
| `npm run themes:build` | Génération des 3 thèmes persona (M3) |

## Règle d'or (workflow git)

1. **Jamais de commit direct sur `main`** — une branche par changement :
   `feat/<scope>-<sujet>`, `fix/…`, `kb/…` (base de connaissance), `chore/…`, `docs/…`
2. **Chaque PR met à jour le CHANGELOG** (section `[Unreleased]`, format Keep a Changelog)
3. Commits conventionnels : `feat(chat): …`, `kb(projects): …` — scopes : `chat`, `theme`, `kb`, `i18n`, `ui`, `infra`, `docs`
4. **IP Accor** : `styles/welds-src/`, les zips et PDF sont gitignorés et ne doivent jamais apparaître dans un diff

### Mettre à jour la base de connaissance (rituel)

```powershell
git switch -c kb/maj-projets
# … éditer les fichiers dans knowledge/ …
git add knowledge/ ; git commit -m "kb(projects): ajout du projet X"
git push -u origin kb/maj-projets   # puis ouvrir la PR
```

## Structure

- `app/` — pages Next.js + route API du chat
- `components/` — UI (chat, header, providers)
- `knowledge/` — base de connaissance markdown (la matière du bot)
- `personas/` — définition des 3 personas (ton, questions suggérées, mapping de thème)
- `styles/` — `welds-src/` (extrait localement, gitignoré) · `generated/` (thèmes persona) 
- `scripts/` — outillage Node (`.mjs`)
- `docs/` — plan de test et golden questions
